"use client";

import { FormEvent, useState } from "react";
import { Box, Button, Callout, Flex, Grid, Heading, Text, TextArea, TextField } from "@radix-ui/themes";
import { Download, Upload } from "lucide-react";

import { ErrorNotice, PageHeader } from "@/components/page-tools";
import { getValues, normalizeApiError, postValues } from "@/lib/api";
import type { ValuesPayload } from "@/types/api";

export default function ValuesPage() {
  const [payload, setPayload] = useState(samplePayload());
  const [result, setResult] = useState<ValuesPayload | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handlePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await postValues(JSON.parse(payload) as ValuesPayload);
      setNotice(`Принято: ${response.accepted_timestamps} timestamp, ${response.parsed_values} values.`);
    } catch (caughtError) {
      setError(caughtError instanceof SyntaxError ? "Payload должен быть валидным JSON." : normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await getValues(Number(formData.get("start")), Number(formData.get("end")));
      setResult(response);
    } catch (caughtError) {
      setError(normalizeApiError(caughtError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-content">
      <PageHeader title="Данные датчиков" description="Технический импорт и просмотр payload `/api/v1/values`." />
      <ErrorNotice message={error} />
      {notice ? (
        <Callout.Root color="green" mb="4">
          <Callout.Text>{notice}</Callout.Text>
        </Callout.Root>
      ) : null}

      <Grid columns={{ initial: "1", lg: "2" }} gap="4">
        <Box className="surface" p="4">
          <Heading size="4" mb="3">
            Импорт
          </Heading>
          <form onSubmit={handlePost}>
            <TextArea value={payload} onChange={(event) => setPayload(event.target.value)} rows={14} />
            <Button type="submit" mt="3" disabled={submitting}>
              <Upload size={16} /> Отправить payload
            </Button>
          </form>
        </Box>

        <Box className="surface" p="4">
          <Heading size="4" mb="3">
            Просмотр
          </Heading>
          <form onSubmit={handleGet}>
            <Grid columns={{ initial: "1", md: "2" }} gap="3">
              <label>
                <Text size="2">Start Unix seconds</Text>
                <TextField.Root name="start" mt="2" inputMode="numeric" required defaultValue="1700000000" />
              </label>
              <label>
                <Text size="2">End Unix seconds</Text>
                <TextField.Root name="end" mt="2" inputMode="numeric" required defaultValue="2000000000" />
              </label>
            </Grid>
            <Button type="submit" mt="3" variant="soft" disabled={submitting}>
              <Download size={16} /> Получить
            </Button>
          </form>
          {result ? (
            <Box mt="4">
              <Text size="2" color="gray">
                Результат
              </Text>
              <pre className="code-output">{JSON.stringify(result, null, 2)}</pre>
            </Box>
          ) : null}
        </Box>
      </Grid>
    </div>
  );
}

function samplePayload() {
  return JSON.stringify(
    {
      1700000000: ["16777343 10 20 NULL", "16777344 11 NULL 30"],
    },
    null,
    2,
  );
}
