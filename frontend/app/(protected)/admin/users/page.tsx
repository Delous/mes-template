'use client';

import { PageLayout } from '@/components/page-layout';
import {
  CreateUserForm,
  CreationNotice,
  PageError,
  PageHeading,
  UsersList,
} from '@/features/admin/users/sections';
import { useUsersPage } from '@/features/admin/users/use-page';

export default function UsersPage() {
  const model = useUsersPage();
  return (
    <PageLayout>
      <PageHeading />
      <PageError model={model} />
      <CreationNotice model={model} />
      <CreateUserForm model={model} />
      <UsersList model={model} />
    </PageLayout>
  );
}
