import * as stylex from "@stylexjs/stylex"

import { Card, CardPanel } from "@/components/ui/card"
import { Grid } from "@/components/ui/grid"
import { Heading } from "@/components/ui/heading"
import { HStack } from "@/components/ui/hstack"
import { Skeleton } from "@/components/ui/skeleton"
import { Stack } from "@/components/ui/stack"
import { Stat, StatLabel, StatValue } from "@/components/ui/stat"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const styles = stylex.create({
  label: { blockSize: 16, inlineSize: 96 },
  tableLabel: { blockSize: 16, inlineSize: 64 },
  title: {
    blockSize: { default: 30, "@media (max-width: 640px)": 25 },
    inlineSize: "60%",
  },
  value: {
    blockSize: { default: 25, "@media (max-width: 640px)": 22.5 },
    inlineSize: 112,
  },
  control: { blockSize: 40, inlineSize: 132 },
  period: { blockSize: 40, inlineSize: 64 },
  icon: { blockSize: 40, inlineSize: 40 },
  bar: { blockSize: 8, inlineSize: "100%" },
})

export function ReportsSkeleton() {
  return (
    <Stack spacing="relaxed">
      <HStack layout="pageHeader">
        <Stack spacing="compact">
          <Heading render={<h1>Focus reports</h1>} />
          <output aria-live="polite">Loading your focus history…</output>
        </Stack>
        <HStack layout="row" aria-hidden="true">
          <Skeleton xstyle={styles.control} />
          <Skeleton xstyle={styles.control} />
        </HStack>
      </HStack>
      <Stack spacing="relaxed" aria-busy="true" aria-hidden="true">
        <Card>
          <CardPanel density="compact">
            <Stack>
              <HStack layout="row">
                <Skeleton xstyle={styles.icon} />
                <Skeleton xstyle={styles.control} />
                <Skeleton xstyle={styles.icon} />
              </HStack>
              <HStack layout="spread">
                <HStack wrap>
                  {[0, 1, 2, 3].map((control) => (
                    <Skeleton key={control} xstyle={styles.period} />
                  ))}
                </HStack>
                <HStack layout="row">
                  {[0, 1].map((field) => (
                    <Stack key={field} spacing="compact">
                      <Skeleton xstyle={styles.label} />
                      <Skeleton xstyle={styles.control} />
                    </Stack>
                  ))}
                </HStack>
              </HStack>
            </Stack>
          </CardPanel>
        </Card>
        <Card>
          <CardPanel density="compact">
            <Grid variant="summary">
              {[0, 1, 2].map((metric) => (
                <Stat key={metric} variant="divided">
                  <StatLabel>
                    <Skeleton xstyle={styles.label} />
                  </StatLabel>
                  <StatValue size="compact">
                    <Skeleton xstyle={styles.value} />
                  </StatValue>
                </Stat>
              ))}
            </Grid>
          </CardPanel>
        </Card>
        <Grid variant="focus">
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
              <Table variant="card">
                <TableCaption>
                  <Skeleton xstyle={styles.label} />
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    {[0, 1, 2, 3].map((column) => (
                      <TableHead key={column} scope="col">
                        <Skeleton xstyle={styles.tableLabel} />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[0, 1, 2].map((row) => (
                    <TableRow key={row}>
                      <TableCell>
                        <Skeleton xstyle={styles.label} />
                      </TableCell>
                      <TableCell>
                        <Stack spacing="compact">
                          <Skeleton xstyle={styles.label} />
                          <Skeleton xstyle={styles.label} />
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Skeleton xstyle={styles.label} />
                      </TableCell>
                      <TableCell>
                        <HStack layout="row">
                          <Skeleton xstyle={styles.icon} />
                          <Skeleton xstyle={styles.icon} />
                        </HStack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <HStack layout="spread">
                <Skeleton xstyle={styles.label} />
                <HStack>
                  <Skeleton xstyle={styles.control} />
                  <Skeleton xstyle={styles.control} />
                </HStack>
              </HStack>
            </Stack>
          </CardPanel>
        </Card>
      </Stack>
    </Stack>
  )
}
