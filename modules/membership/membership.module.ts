import {Global, Module} from '@nestjs/common';
import {MembershipService} from './membership.service';
import {MembershipController} from './membership.controller';

@Global()
@Module({
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
