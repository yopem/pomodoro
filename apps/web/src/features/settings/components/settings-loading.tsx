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
  title: {
    blockSize: { default: 25, "@media (max-width: 640px)": 22.5 },
    inlineSize: "45%",
  },
  description: { blockSize: 20, inlineSize: "85%" },
  label: { blockSize: 16, inlineSize: "60%" },
  control: {
    blockSize: { default: 36, "@media (min-width: 640px)": 32 },
    inlineSize: "100%",
  },
  saveText: { inlineSize: "min(100%, 240px)" },
  toggleLabel: { blockSize: 20, inlineSize: "65%" },
  toggle: { blockSize: 20, inlineSize: 36 },
  button: {
    blockSize: { default: 40, "@media (min-width: 640px)": 36 },
    inlineSize: 132,
  },
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
      <Stack spacing="relaxed">
        {sections.map((section) => (
          <Card key={section.name}>
            <CardHeader separator>
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
          <CardHeader separator>
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
            <Stack spacing="compact" xstyle={styles.saveText}>
              <Skeleton xstyle={styles.label} />
              <Skeleton xstyle={styles.description} />
            </Stack>
            <Skeleton xstyle={styles.button} />
          </HStack>
        </Box>
        <Card>
          <CardHeader separator>
            <Skeleton xstyle={styles.title} />
            <Skeleton xstyle={styles.description} />
          </CardHeader>
          <CardPanel>
            <Stack>
              <HStack layout="spread">
                <Stack spacing="compact" xstyle={styles.saveText}>
                  <Skeleton xstyle={styles.title} />
                  <Skeleton xstyle={styles.description} />
                </Stack>
                <Skeleton xstyle={styles.button} />
              </HStack>
              <Box variant="backupUpload">
                <Stack spacing="relaxed">
                  <Stack spacing="compact">
                    <Skeleton xstyle={styles.title} />
                    <Skeleton xstyle={styles.description} />
                  </Stack>
                  <Stack>
                    <HStack layout="spread">
                      <Stack spacing="compact" xstyle={styles.saveText}>
                        <Skeleton xstyle={styles.label} />
                        <Skeleton xstyle={styles.description} />
                      </Stack>
                      <Skeleton xstyle={styles.button} />
                    </HStack>
                    <Skeleton xstyle={styles.label} />
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </CardPanel>
        </Card>
      </Stack>
    </Grid>
  )
}
