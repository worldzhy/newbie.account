import {Module} from '@nestjs/common';
import {ApprovedSubnetController} from './approved-subnet.controller';
import {ApprovedSubnetService} from './approved-subnet.service';

@Module({
  controllers: [ApprovedSubnetController],
  providers: [ApprovedSubnetService],
})
export class ApprovedSubnetModule {}
