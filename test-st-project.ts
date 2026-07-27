import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ServiceTitanService } from './src/modules/service-titan/service-titan.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const stService = app.get(ServiceTitanService);
  
  try {
    const customers = await stService.getCustomers();
    const stCust = customers.find(c => c.name.includes("ANR"));
    if (stCust) {
       const projects = await stService.getProjectsByCustomerId(stCust.id.toString());
       const proj = projects.find(p => p.id.toString() === "1285670");
       console.log("PROJECT DATA FOR 1285670:");
       console.log(JSON.stringify(proj, null, 2));
    } else {
       console.log("Could not find ANR Industries customer");
       const projects = await stService.getProjectsByCustomerId(customers[0].id.toString());
       console.log("First customer projects:");
       console.log(JSON.stringify(projects, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
  
  await app.close();
}
bootstrap();
