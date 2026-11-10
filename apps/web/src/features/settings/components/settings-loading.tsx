import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Card, CardHeader, CardPanel } from "@/components/ui/card"
import { Field } from "@/components/ui/field"
import { Grid } from "@/components/ui/grid"
import { HStack } from "@/components/ui/hstack"
import { Skeleton } from "@/components/ui/skeleton"
import { Stack } from "@/components/ui/stack"

const sections = [
  { name: "timer", fields: 4 },
  { name: "sound", fields: 5 },
  { name: "appearance", fields: 6 },
]

const styles = stylex.create({
  navigation: {
    blockSize: 44,
    inlineSize: {
      default: "100%",
      "@media (max-width: 768px)": 120,
    },
  },
  title: { blockSize: 28, inlineSize: "45%" },
  description: { blockSize: 20, inlineSize: "85%" },
  label: { blockSize: 16, inlineSize: "60%" },
  control: {
    blockSize: { default: 36, "@media (min-width: 640px)": 32 },
    inlineSize: "100%",
  },
  toggleLabel: { blockSize: 20, inlineSize: "65%" },
  toggle: { blockSize: 20, inlineSize: 36 },
  button: { blockSize: 44, inlineSize: 132 },
})

export function SettingsFieldSkeleton() {
  return (
    <Stack spacing="compact">
      <Skeleton xstyle={styles.label} />
      <Skeleton xstyle={styles.control} />
    </Stack>
  )
}

export function SettingsSkeleton() {
  return (
    <Grid variant="settings" aria-busy="true" aria-hidden="true">
      <Box variant="settingsNavigation">
        {[0, 1, 2, 3, 4].map((item) => (
          <Skeleton key={item} xstyle={styles.navigation} />
        ))}
      </Box>
      <Stack spacing="page">
        {sections.map((section) => (
          <Card key={section.name}>
            <CardHeader>
              <Skeleton xstyle={styles.title} />
              <Skeleton xstyle={styles.description} />
            </CardHeader>
            <CardPanel>
              <Grid variant="workspace">
                {Array.from({ length: section.fields }, (_, field) => (
                  <SettingsFieldSkeleton key={field} />
                ))}
              </Grid>
            </CardPanel>
          </Card>
        ))}
        <Card>
          <CardHeader>
            <Skeleton xstyle={styles.title} />
            <Skeleton xstyle={styles.description} />
          </CardHeader>
          <CardPanel>
            <Stack spacing="relaxed">
              <Grid variant="workspace">
                <SettingsFieldSkeleton />
              </Grid>
              <Grid>
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <Field key={item} layout="switch">
                    <Skeleton xstyle={styles.toggleLabel} />
                    <Skeleton xstyle={styles.toggle} />
                  </Field>
                ))}
              </Grid>
              <Skeleton xstyle={styles.button} />
            </Stack>
          </CardPanel>
        </Card>
        <Box variant="settingsSave">
          <HStack layout="spread">
            <Skeleton xstyle={styles.label} />
            <Skeleton xstyle={styles.button} />
          </HStack>
        </Box>
        <Card>
          <CardHeader>
            <Skeleton xstyle={styles.title} />
            <Skeleton xstyle={styles.description} />
          </CardHeader>
          <CardPanel>
            <Stack>
              <HStack layout="spread">
                <Skeleton xstyle={styles.title} />
                <Skeleton xstyle={styles.button} />
              </HStack>
              <Skeleton xstyle={styles.description} />
              <Box variant="backupUpload">
                <Stack spacing="relaxed">
                  <Skeleton xstyle={styles.title} />
                  <Skeleton xstyle={styles.description} />
                  <HStack layout="spread">
                    <Skeleton xstyle={styles.label} />
                    <Skeleton xstyle={styles.button} />
                  </HStack>
                  <Skeleton xstyle={styles.label} />
                </Stack>
              </Box>
            </Stack>
          </CardPanel>
        </Card>
      </Stack>
    </Grid>
  )
}
