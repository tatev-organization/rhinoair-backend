import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ServiceTitanService } from './src/modules/service-titan/service-titan.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const stService = app.get(ServiceTitanService);
  const tenantId = stService['configService'].get('SERVICETITAN_TENANT_ID') || '';
  const jobId = 575776; // From user's screenshot

  const endpointsToTest = [
    `/jpm/v2/tenant/${tenantId}/jobs/${jobId}/attachments`,
    `/dispatch/v2/tenant/${tenantId}/jobs/${jobId}/attachments`,
    `/crm/v2/tenant/${tenantId}/jobs/${jobId}/attachments`,
    `/accounting/v2/tenant/${tenantId}/jobs/${jobId}/attachments`
  ];

  for (const ep of endpointsToTest) {
    try {
      console.log(`Testing ${ep}...`);
      const res: any = await stService.request('GET', ep);
      console.log(`SUCCESS for ${ep} - Data:`, res?.data?.length || res?.length || 'Exists');
    } catch (err: any) {
      console.log(`FAILED for ${ep} - ${err.message}`);
    }
  }
  
  await app.close();
}
bootstrap();
