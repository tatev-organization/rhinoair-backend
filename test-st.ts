import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ServiceTitanService } from './src/modules/service-titan/service-titan.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const stService = app.get(ServiceTitanService);
  
  const tenantId = '4608271893';
  const estimateId = '1280167';
  
  try {
    const getRes: any = await stService['request']('GET', `/sales/v2/tenant/${tenantId}/estimates/${estimateId}`);
    
    // Try PUT with SoldByEmployeeId
    const payload = {
      name: getRes.name,
      summary: getRes.summary,
      status: 'Sold', 
      soldById: 1055523,
      soldByEmployeeId: 1055523,
      soldBy: 1055523
    };
    await stService['request']('PUT', `/sales/v2/tenant/${tenantId}/estimates/${estimateId}`, payload);
    console.log('SUCCESS: PUT with status Sold and soldBy parameters');
  } catch (e: any) {
    console.error('FAIL: PUT soldBy', e?.response?.data || e.message);
  }

  // Test dismiss
  try {
    const getRes: any = await stService['request']('GET', `/sales/v2/tenant/${tenantId}/estimates/${estimateId}`);
    const payload = {
      name: getRes.name,
      summary: getRes.summary,
      status: 'Dismissed'
    };
    await stService['request']('PUT', `/sales/v2/tenant/${tenantId}/estimates/${estimateId}`, payload);
    console.log('SUCCESS: PUT with status Dismissed');
  } catch (e: any) {
    console.error('FAIL: PUT Dismissed', e?.response?.data || e.message);
  }

  await app.close();
}
bootstrap();
