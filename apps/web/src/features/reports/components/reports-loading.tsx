import * as stylex from "@stylexjs/stylex"

import { Card, CardPanel } from "@/components/ui/card"
import { Grid } from "@/components/ui/grid"
import { HStack } from "@/components/ui/hstack"
import { Skeleton } from "@/components/ui/skeleton"
import { Stack } from "@/components/ui/stack"
import { Stat, StatLabel, StatValue } from "@/components/ui/stat"

const styles = stylex.create({
  label: { blockSize: 16, inlineSize: 96 },
  title: { blockSize: 28, inlineSize: "60%" },
  value: { blockSize: 36, inlineSize: 112 },
  control: { blockSize: 44, inlineSize: 132 },
  line: { blockSize: 16, inlineSize: "85%" },
  bar: { blockSize: 8, inlineSize: "100%" },
})

export function ReportsSkeleton() {
  return (
    <Stack spacing="page">
      <output aria-live="polite">Loading your focus history…</output>
      <Stack spacing="page" aria-busy="true" aria-hidden="true">
        <HStack layout="pageHeader">
          <Skeleton xstyle={styles.line} />
          <HStack layout="row">
            <Skeleton xstyle={styles.control} />
            <Skeleton xstyle={styles.control} />
          </HStack>
        </HStack>
        <Card>
          <CardPanel>
            <Stack>
              <HStack layout="spread">
                <Skeleton xstyle={styles.title} />
                <Skeleton xstyle={styles.control} />
              </HStack>
              <HStack layout="row">
                {[0, 1, 2, 3].map((control) => (
                  <Skeleton key={control} xstyle={styles.control} />
                ))}
              </HStack>
            </Stack>
          </CardPanel>
        </Card>
        <Card>
          <CardPanel>
            <HStack layout="spread">
              {[0, 1, 2].map((metric) => (
                <Stat key={metric}>
                  <StatLabel>
                    <Skeleton xstyle={styles.label} />
                  </StatLabel>
                  <StatValue>
                    <Skeleton xstyle={styles.value} />
                  </StatValue>
                </Stat>
              ))}
            </HStack>
          </CardPanel>
        </Card>
        <Grid variant="workspace">
          {[0, 1].map((chart) => (
            <Card key={chart}>
              <CardPanel>
                <Stack>
                  <Skeleton xstyle={styles.title} />
                  {[0, 1, 2, 3, 4].map((row) => (
                    <Stack key={row} spacing="compact">
                      <HStack layout="spread">
                        <Skeleton xstyle={styles.label} />
                        <Skeleton xstyle={styles.label} />
                      </HStack>
                      <Skeleton xstyle={styles.bar} />
                    </Stack>
                  ))}
                </Stack>
              </CardPanel>
            </Card>
          ))}
        </Grid>
        <Card>
          <CardPanel>
            <Stack>
              <Skeleton xstyle={styles.title} />
              {[0, 1, 2].map((row) => (
                <HStack key={row} layout="spread">
                  <Skeleton xstyle={styles.line} />
                  <Skeleton xstyle={styles.label} />
                </HStack>
              ))}
            </Stack>
          </CardPanel>
        </Card>
      </Stack>
    </Stack>
  )
}
