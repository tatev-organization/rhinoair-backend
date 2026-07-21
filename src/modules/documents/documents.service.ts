import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { JwtUser } from '../../common/decorators/current-user.decorator';
import { DocumentType } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    projectId: string,
    category: string,
    user: JwtUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    // Determine type based on category
    let type: DocumentType = DocumentType.OTHER;
    if (category.toLowerCase().includes('plan') || category.toLowerCase().includes('blueprint')) type = DocumentType.BLUEPRINT;
    else if (category.toLowerCase().includes('permit')) type = DocumentType.PERMIT;
    else if (category.toLowerCase().includes('agreement')) type = DocumentType.AGREEMENT;
    else if (category.toLowerCase().includes('estimate')) type = DocumentType.ESTIMATE;
    else if (category.toLowerCase().includes('change order')) type = DocumentType.CHANGE_ORDER;
    else if (category.toLowerCase().includes('submittal') || category.toLowerCase().includes('spec')) type = DocumentType.SUBMITTAL;
    else if (category.toLowerCase().includes('certificate')) type = DocumentType.CERTIFICATE;
    else if (category.toLowerCase().includes('shared')) type = DocumentType.SHARED;

    let uploadResult;
    try {
      uploadResult = await this.storage.uploadFile(
        file.buffer,
        `rhino_air/documents/${projectId}`,
        'auto'
      );
    } catch (error) {
      throw new BadRequestException('File upload failed: ' + error.message);
    }

    const document = await this.prisma.document.create({
      data: {
        companyId: user.companyId!,
        projectId,
        type,
        category,
        name: file.originalname,
        fileUrl: uploadResult.secure_url,
        fileKey: uploadResult.public_id,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: user.userId,
        status: 'AVAILABLE'
      },
    });

    return document;
  }
}
