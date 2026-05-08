import * as React from 'react';
import {
  Bullseye,
  DatePicker,
  Split,
  SplitItem,
  Switch,
  Content,
  TimePicker,
} from '@patternfly/react-core';
import {
  convertDateToSimpleDateString,
  convertDateToTimeString,
  ensureTimeFormat,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/time';
import DashboardSplitItemLabel from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/split/DashboardSplitItemLabel';
import DashboardSplitReserveSpace from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/split/DashboardSplitReserveSpace';
import type { RunDateTime } from '@odh-dashboard/dashboard-foundation-frontend/utilities/pipelinePeriodicSchedule';
import {
  DATE_FORMAT,
  DEFAULT_TIME,
  RUN_OPTION_LABEL_SIZE,
} from '@odh-dashboard/pipelines/concepts/content/createRun/const';

type RunTypeSectionDateTimeProps = {
  id: string;
  label: string;
  value?: RunDateTime;
  onChange: (dateTime?: RunDateTime) => void;
  adjustNow?: (now: Date) => Date;
};

const RunTypeSectionDateTime: React.FC<RunTypeSectionDateTimeProps> = ({
  id,
  label,
  value,
  onChange,
  adjustNow,
}) => {
  const handleChange = ({ date, time }: { date?: string; time?: string }) => {
    onChange({
      date: date ?? value?.date ?? DATE_FORMAT,
      time: time ?? value?.time ?? DEFAULT_TIME,
    });
  };

  return (
    <Split hasGutter>
      <DashboardSplitItemLabel width={RUN_OPTION_LABEL_SIZE}>
        <Content component="p">{label}</Content>
      </DashboardSplitItemLabel>
      <SplitItem>
        <Bullseye>
          <Switch
            id={id}
            data-testid={`${id}-toggle`}
            aria-label={`${label} is on`}
            isChecked={value !== undefined}
            onChange={(e, checked) => {
              if (checked) {
                let now = new Date();
                if (adjustNow) {
                  now = adjustNow(now);
                }
                handleChange({
                  date: convertDateToSimpleDateString(now) ?? undefined,
                  time: convertDateToTimeString(now) ?? undefined,
                });
              } else {
                onChange(undefined);
              }
            }}
          />
        </Bullseye>
      </SplitItem>
      <SplitItem isFilled>
        <DashboardSplitReserveSpace hasGutter visible={value !== undefined}>
          <SplitItem>
            <DatePicker
              data-testid={`${id}-date`}
              value={value?.date}
              onChange={(e, date) => handleChange({ date })}
            />
          </SplitItem>
          <SplitItem>
            <TimePicker
              data-testid={`${id}-time`}
              time={value?.time ?? DEFAULT_TIME}
              onChange={(e, time) => handleChange({ time: ensureTimeFormat(time) ?? undefined })}
            />
          </SplitItem>
        </DashboardSplitReserveSpace>
      </SplitItem>
    </Split>
  );
};

export default RunTypeSectionDateTime;
