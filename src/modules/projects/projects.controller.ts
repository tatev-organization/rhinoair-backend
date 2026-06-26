import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get projects for the current user' })
  @ApiResponse({ status: 200, description: 'Returns project list.' })
  findAll(@Req() req: any) {
    return this.projectsService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiResponse({ status: 200, description: 'Returns project details.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.findOne(id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a project' })
  @ApiResponse({ status: 201, description: 'Project created.' })
  create(@Body() createProjectDto: CreateProjectDto, @Req() req: any) {
    return this.projectsService.create(createProjectDto, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req: any,
  ) {
    return this.projectsService.update(id, updateProjectDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.remove(id, req.user);
  }
}
