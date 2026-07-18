import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ServiceTitanService {
  private readonly logger = new Logger(ServiceTitanService.name);

  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  // 1. Get Access Token
  async getAccessToken(): Promise<string> {
    // If we already have a token and it is not expired, use it
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    this.logger.log('Fetching new ServiceTitan access token...');

    try {
      const clientId =
        this.configService.get<string>('SERVICETITAN_CLIENT_ID') || '';
      const clientSecret =
        this.configService.get<string>('SERVICETITAN_CLIENT_SECRET') || '';

      const url = 'https://auth.servicetitan.io/connect/token';
      const body = new URLSearchParams();
      body.append('grant_type', 'client_credentials');
      body.append('client_id', clientId);
      body.append('client_secret', clientSecret);

      const response = await firstValueFrom(
        this.httpService.post(url, body.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      this.accessToken = response.data.access_token;

      // Save expiration time (minus 60 seconds to be safe)
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

      return this.accessToken as string;
    } catch (error: any) {
      this.logger.error('Failed to get token', error);
      throw new HttpException(
        'ST Auth Failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 2. Helper to send any request to ServiceTitan
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const token = await this.getAccessToken();
    const appKey = this.configService.get<string>('SERVICETITAN_APP_KEY') || '';
    const url = `https://api.servicetitan.io${endpoint}`;

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: method,
          url: url,
          data: data,
          headers: {
            Authorization: `Bearer ${token}`,
            'ST-App-Key': appKey,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.title || error.message || 'ST API Error';
      const statusCode =
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

      this.logger.error(
        `ST API Error on ${endpoint}: ${errorMsg}`,
        error.response?.data || error,
      );
      throw new HttpException(`ServiceTitan Error: ${errorMsg}`, statusCode);
    }
  }
  // 3. Get All Customers
  async getCustomers(): Promise<any[]> {
    const tenantId =
      this.configService.get<string>('SERVICETITAN_TENANT_ID') || '';
    try {
      const response = await this.request<any>(
        'GET',
        `/crm/v2/tenant/${tenantId}/customers`,
      );
      return response.data || [];
    } catch (error) {
      this.logger.error('Failed to fetch customers from ST', error);
      return [];
    }
  }

  // Get Jobs for a specific Customer
  async getJobsByCustomerId(customerId: string): Promise<any[]> {
    const tenantId =
      this.configService.get<string>('SERVICETITAN_TENANT_ID') || '';
    try {
      // In ServiceTitan JPM v2, we filter jobs by customerId
      const response = await this.request<any>(
        'GET',
        `/jpm/v2/tenant/${tenantId}/jobs?customerId=${customerId}`,
      );
      // ST API typically wraps arrays in a 'data' property
      return response.data || [];
    } catch (error) {
      this.logger.error(
        `Failed to fetch jobs for customer ${customerId} from ST`,
        error,
      );
      return [];
    }
  }

  // 4. Create Customer
  async createCustomer(
    name: string,
    email: string,
    phone: string,
    street: string,
    city: string,
    state: string,
    zip: string,
  ): Promise<{ customerId: number; locationId: number | null } | null> {
    const tenantId =
      this.configService.get<string>('SERVICETITAN_TENANT_ID') || '';

    const payload = {
      name: name,
      type: 'Commercial',
      address: {
        street: street,
        city: city,
        state: state,
        zip: zip,
        country: 'USA',
      },
      locations: [
        {
          name: 'Primary1 Location',
          address: {
            street: street,
            city: city,
            state: state,
            zip: zip,
            country: 'USA',
          },
          contacts: [
            {
              type: 'MobilePhone',
              value: phone,
              memo: 'Primary Phone',
            },
          ],
        },
      ],
      contacts: [
        {
          type: 'Email',
          value: email,
          memo: 'Created from Partner Portal',
        },
        {
          type: 'MobilePhone',
          value: phone,
          memo: 'Primary Phone',
        },
      ],
    };

    const response = await this.request<any>(
      'POST',
      `/crm/v2/tenant/${tenantId}/customers`,
      payload,
    );

    const locationId =
      response.locations && response.locations.length > 0
        ? response.locations[0].id
        : null;

    return { customerId: response.id, locationId: locationId };
  }

  // 4. Create Location for a Customer
  async createLocation(
    customerId: number,
    street: string,
    city: string = '',
    state: string = '',
    zip: string = '',
  ): Promise<number> {
    const tenantId =
      this.configService.get<string>('SERVICETITAN_TENANT_ID') || '';
    const payload = {
      customerId,
      name: street || 'Project Location',
      address: {
        street,
        city,
        state,
        zip,
        country: 'USA',
      },
    };

    const response = await this.request<any>(
      'POST',
      `/crm/v2/tenant/${tenantId}/locations`,
      payload,
    );
    return response.id;
  }

  // 5. Create Project
  async createProject(
    customerId: number,
    locationId: number,
    name: string,
    summary: string,
  ): Promise<number> {
    const tenantId =
      this.configService.get<string>('SERVICETITAN_TENANT_ID') || '';
    const payload = {
      customerId,
      locationId,
      name,
      summary,
    };

    const response = await this.request<any>(
      'POST',
      `/jpm/v2/tenant/${tenantId}/projects`,
      payload,
    );
    return response.id;
  }

  // 6. Create Estimate
  async createEstimate(
    projectId: number,
    summary: string,
    total: number,
  ): Promise<number> {
    const tenantId =
      this.configService.get<string>('SERVICETITAN_TENANT_ID') || '';

    // ST allows creating estimates without predefined items, or with custom items.
    // For now, we will add the quote total into the summary, or as a manual item if needed.
    const payload = {
      projectId,
      name: 'Partner Portal Quote',
      summary: summary + `\n\nTotal Price: $${total.toFixed(2)}`,
    };

    const response = await this.request<any>(
      'POST',
      `/sales/v2/tenant/${tenantId}/estimates`,
      payload,
    );
    return response.id;
  }

  // 7. Get Location details
  async getLocationById(locationId: string): Promise<any> {
    const tenantId =
      this.configService.get<string>('SERVICETITAN_TENANT_ID') || '';
    try {
      const response = await this.request<any>(
        'GET',
        `/crm/v2/tenant/${tenantId}/locations/${locationId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to fetch location ${locationId} from ST`,
        error,
      );
      return null;
    }
  }

  // 8. Get Invoices for a Job
  async getInvoicesByIds(invoiceIds: string): Promise<any[]> {
    if (!invoiceIds) return [];
    const tenantId =
      this.configService.get<string>('SERVICETITAN_TENANT_ID') || '';
    try {
      const response = await this.request<any>(
        'GET',
        `/accounting/v2/tenant/${tenantId}/invoices?ids=${invoiceIds}`,
      );
      return response.data || [];
    } catch (error) {
      this.logger.error(
        `Failed to fetch invoices ${invoiceIds} from ST`,
        error,
      );
      return [];
    }
  }
}
