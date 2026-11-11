import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Card, CardPanel } from "@/components/ui/card"
import { Grid } from "@/components/ui/grid"
import { HStack } from "@/components/ui/hstack"
import { List } from "@/components/ui/list"
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
  loadingStatus: {
    position: "absolute",
    inlineSize: 1,
    blockSize: 1,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  },
  label: { blockSize: 24, inlineSize: 96 },
  clock: {
    blockSize: {
      default: "clamp(3.5rem, 6vw, 5.5rem)",
      "@media (max-width: 640px)": "clamp(2.75rem, 17vw, 5rem)",
    },
    inlineSize: "60%",
  },
  phaseControl: { blockSize: 40, inlineSize: 80 },
  control: { blockSize: 40, inlineSize: 80 },
  primaryControl: { blockSize: 40, inlineSize: 104 },
  iconControl: { blockSize: 40, inlineSize: 40 },
  heading: {
    blockSize: { default: 30, "@media (max-width: 640px)": 25 },
    inlineSize: 96,
  },
  value: { blockSize: 37.5, inlineSize: "65%" },
  title: { blockSize: 24, inlineSize: "65%" },
  line: { blockSize: 16, inlineSize: "85%" },
  shortLine: { blockSize: 16, inlineSize: "45%" },
})

export function FocusBrowserControlsSkeleton() {
  return (
    <HStack wrap aria-hidden="true">
      <Skeleton xstyle={styles.iconControl} />
      <Skeleton xstyle={styles.iconControl} />
    </HStack>
  )
}

export function FocusTimerSkeleton() {
  return (
    <Card aria-hidden="true">
      <CardPanel>
        <Stack layout="centered" spacing="relaxed" xstyle={styles.timer}>
          <HStack layout="centered">
            <Skeleton xstyle={styles.phaseControl} />
            <Skeleton xstyle={styles.phaseControl} />
            <Skeleton xstyle={styles.phaseControl} />
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
            <Stack layout="centered">
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
    <>
      <output aria-live="polite" {...stylex.props(styles.loadingStatus)}>
        Loading your workspace…
      </output>
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
                          <Skeleton xstyle={styles.value} />
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
          <Stack>
            <HStack layout="spread">
              <Skeleton xstyle={styles.heading} />
              <HStack layout="row">
                <Skeleton xstyle={styles.primaryControl} />
                <Skeleton xstyle={styles.primaryControl} />
              </HStack>
            </HStack>
            <List variant="plain">
              {[0, 1, 2].map((row) => (
                <Card key={row} render={<li />}>
                  <CardPanel density="compact">
                    <Stack spacing="compact">
                      <HStack layout="spread">
                        <Skeleton xstyle={styles.shortLine} />
                        <Skeleton xstyle={styles.label} />
                      </HStack>
                      <HStack layout="row">
                        <Skeleton xstyle={styles.iconControl} />
                        <Skeleton xstyle={styles.control} />
                        <Skeleton xstyle={styles.control} />
                      </HStack>
                    </Stack>
                  </CardPanel>
                </Card>
              ))}
            </List>
          </Stack>
        </Box>
      </Grid>
    </>
  )
}
