import {generateHash} from '@framework/utilities/common.util';
import {
  verifyEmail,
  verifyPassword,
} from '@microservices/account/helpers/validator';
import {BadRequestException} from '@nestjs/common';
import {Prisma} from '@prisma/client';

export const prismaExtensionForUser = Prisma.defineExtension({
  name: 'query-extension-usr',
  query: {
    user: {
      async create({args, query}) {
        if (args.data.email) {
          if (!verifyEmail(args.data.email)) {
            throw new BadRequestException('Your email is not valid.');
          }
          args.data.email = args.data.email.toLowerCase();
        }

        if (args.data.password) {
          if (!verifyPassword(args.data.password)) {
            throw new BadRequestException(
              'The password is not strong enough. (length >= 8, lowercase >= 1, uppercase >= 1, numbers >= 1, symbols >= 1)'
            );
          }
          // Generate hash of the password.
          const hash = await generateHash(args.data.password);
          args.data.password = hash;
        }

        return query(args);
      },
      async update({args, query}) {
        if (args.data.email) {
          if (!verifyEmail(args.data.email as string)) {
            throw new BadRequestException('Your email is not valid.');
          }
          args.data.email = (args.data.email as string).toLowerCase();
        }

        if (args.data.password) {
          if (!verifyPassword(args.data.password as string)) {
            throw new BadRequestException(
              'The password is not strong enough. (length >= 8, lowercase >= 1, uppercase >= 1, numbers >= 1, symbols >= 1)'
            );
          }
          // Generate hash of the password.
          const hash = await generateHash(args.data.password as string);
          args.data.password = hash;
        }

        return query(args);
      },
    },
  },
});
