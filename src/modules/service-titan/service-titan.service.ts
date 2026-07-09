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

  // 3. Create Customer
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
          name: 'Primary Location',
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
}
