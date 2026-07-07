import { Test, TestingModule } from '@nestjs/testing';
import { ServiceTitanService } from './service-titan.service';

describe('ServiceTitanService', () => {
  let service: ServiceTitanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceTitanService],
    }).compile();

    service = module.get<ServiceTitanService>(ServiceTitanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
