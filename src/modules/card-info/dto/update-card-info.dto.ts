import { PartialType } from '@nestjs/mapped-types';
import { CreateCardInfoDto } from './create-card-info.dto';

export class UpdateCardInfoDto extends PartialType(CreateCardInfoDto) {}
