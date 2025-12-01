import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { TokenPayload, UserRole } from '@space-app/shared';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSpaceDto } from './dto/create-space.dto';
import { QuerySpacesDto } from './dto/query-spaces.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { SpacesService } from './spaces.service';

@Controller('spaces')
@UseGuards(JwtAuthGuard)
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  create(
    @Body() createSpaceDto: CreateSpaceDto,
    @CurrentUser('sub') userId: string
  ) {
    return this.spacesService.create(createSpaceDto, userId);
  }

  @Get()
  @Public()
  findAll(@Query() query: QuerySpacesDto) {
    return this.spacesService.findAll(query);
  }

  @Get('my-spaces')
  findMySpaces(@CurrentUser('sub') userId: string) {
    return this.spacesService.findByOwner(userId);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.spacesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSpaceDto: UpdateSpaceDto,
    @CurrentUser() user: TokenPayload
  ) {
    return this.spacesService.update(
      id,
      updateSpaceDto,
      user.sub,
      user.role as UserRole
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: TokenPayload) {
    return this.spacesService.remove(id, user.sub, user.role as UserRole);
  }
}
