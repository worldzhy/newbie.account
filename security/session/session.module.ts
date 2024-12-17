import {Global, Module} from '@nestjs/common';
import {SessionService} from './session.service';
import {UserRefreshTokenModule} from './refresh-token.module';

@Global()
@Module({
  imports: [UserRefreshTokenModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
