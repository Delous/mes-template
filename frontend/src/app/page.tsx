import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Box, Flex, Heading, Text } from "@radix-ui/themes";
import { PackageCheck } from "lucide-react";

import { getMe } from "@/entities/auth/api";
import { LoginForm } from "@/features/auth/LoginForm";
import { labels } from "@/shared/i18n/labels";

function getSafeNextPath(next: string | string[] | undefined) {
  const value = Array.isArray(next) ? next[0] : next;
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/tasks";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const cookieStore = await cookies();
  const params = await searchParams;

  if (cookieStore.has("arm_auth") && (await getMe(cookieStore.toString()))) {
    redirect("/tasks");
  }

  return (
    <main className="login-page">
      <section className="login-panel surface">
        <Flex direction="column" gap="5">
          <Flex align="center" gap="3">
            <Flex align="center" justify="center" width="42px" height="42px" className="brand-mark">
              <PackageCheck size={22} />
            </Flex>
            <Box>
              <Heading size="6">{labels.app.name}</Heading>
              <Text size="2" color="gray">
                {labels.auth.title}
              </Text>
            </Box>
          </Flex>

          <Box>
            <Heading size="5" mb="2">
              {labels.auth.title}
            </Heading>
            <Text as="p" size="2" color="gray" className="login-copy">
              {labels.auth.description}
            </Text>
          </Box>

          <LoginForm nextPath={getSafeNextPath(params.next)} />
        </Flex>
      </section>
    </main>
  );
}
