import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Card, CardPanel } from "@/components/ui/card"
import { Grid } from "@/components/ui/grid"
import { HStack } from "@/components/ui/hstack"
import { Skeleton } from "@/components/ui/skeleton"
import { Stack } from "@/components/ui/stack"
import {
  Stat,
  StatDescription,
  StatLabel,
  StatValue,
} from "@/components/ui/stat"
import { Text } from "@/components/ui/text"

const styles = stylex.create({
  timer: { marginBlock: { default: 24, "@media (max-width: 640px)": 8 } },
  label: { blockSize: 16, inlineSize: 96 },
  clock: { blockSize: 80, inlineSize: "60%" },
  control: { blockSize: 44, inlineSize: 80 },
  primaryControl: { blockSize: 44, inlineSize: 104 },
  title: { blockSize: 24, inlineSize: "65%" },
  line: { blockSize: 16, inlineSize: "85%" },
  shortLine: { blockSize: 16, inlineSize: "45%" },
})

export function FocusTimerSkeleton() {
  return (
    <Card aria-hidden="true">
      <CardPanel>
        <Stack layout="centered" spacing="relaxed" xstyle={styles.timer}>
          <HStack layout="centered">
            <Skeleton xstyle={styles.control} />
            <Skeleton xstyle={styles.control} />
            <Skeleton xstyle={styles.control} />
          </HStack>
          <Box variant="focusDial">
            <Skeleton xstyle={styles.label} />
            <Skeleton xstyle={styles.clock} />
            <Skeleton xstyle={styles.label} />
          </Box>
          <HStack layout="centered">
            <Skeleton xstyle={styles.primaryControl} />
            <Skeleton xstyle={styles.control} />
            <Skeleton xstyle={styles.control} />
          </HStack>
          <Skeleton xstyle={styles.label} />
          <Box variant="focusTask">
            <Stack layout="centered" spacing="compact">
              <Skeleton xstyle={styles.label} />
              <Skeleton xstyle={styles.title} />
            </Stack>
          </Box>
        </Stack>
      </CardPanel>
    </Card>
  )
}

export function TimerWorkspaceSkeleton({
  fullscreen,
}: {
  fullscreen: boolean
}) {
  return (
    <Stack spacing="page">
      <output aria-live="polite">Loading your workspace…</output>
      <Grid variant={fullscreen ? "default" : "focus"} aria-busy="true">
        <Stack spacing="page">
          <FocusTimerSkeleton />
          <Box variant="dailyOverview" hidden={fullscreen} aria-hidden="true">
            <Stack>
              <Text variant="label">Today at a glance</Text>
              <Card>
                <CardPanel>
                  <Grid variant="summary">
                    {[0, 1, 2].map((column) => (
                      <Stat variant="divided" key={column}>
                        <StatLabel>
                          <Skeleton xstyle={styles.line} />
                        </StatLabel>
                        <StatValue>
                          <Skeleton xstyle={styles.title} />
                        </StatValue>
                        <StatDescription>
                          <Skeleton xstyle={styles.line} />
                        </StatDescription>
                      </Stat>
                    ))}
                  </Grid>
                </CardPanel>
              </Card>
            </Stack>
          </Box>
        </Stack>
        <Box variant="taskQueue" hidden={fullscreen} aria-hidden="true">
          <Stack spacing="relaxed">
            <Stack spacing="compact">
              <Text variant="label">Tasks</Text>
              <Skeleton xstyle={styles.shortLine} />
            </Stack>
            {[0, 1, 2].map((row) => (
              <Card key={row}>
                <CardPanel>
                  <Stack>
                    <Skeleton xstyle={styles.title} />
                    <Skeleton xstyle={styles.line} />
                    <Skeleton xstyle={styles.shortLine} />
                  </Stack>
                </CardPanel>
              </Card>
            ))}
          </Stack>
        </Box>
      </Grid>
    </Stack>
  )
}
