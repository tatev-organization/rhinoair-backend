import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  CurrentUser,
  JwtUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get projects for the current partner' })
  @ApiResponse({ status: 200, description: 'Returns project list.' })
  findAll(@CurrentUser() user: JwtUser) {
    return this.projectsService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiResponse({ status: 200, description: 'Returns project details.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.projectsService.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  @ApiResponse({ status: 201, description: 'Project created.' })
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.projectsService.create(createProjectDto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.projectsService.update(id, updateProjectDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.projectsService.remove(id, user);
  }

  @Post(':projectId/change-orders/:changeOrderId/decide')
  @ApiOperation({ summary: 'Approve or decline a change order' })
  decideChangeOrder(
    @Param('projectId') projectId: string,
    @Param('changeOrderId') changeOrderId: string,
    @Body() body: { isApproved: boolean },
    @CurrentUser() user: JwtUser,
  ) {
    return this.projectsService.decideChangeOrder(
      projectId,
      changeOrderId,
      body.isApproved,
      user,
    );
  }
}
