import {
  ActionIcon,
  Group,
  NumberInput,
  Popover,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { IconTrash, IconWorld } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../core/store';
import { WorldResourcesList } from '../recipes/WorldResources';
import {
  FactoryInputIcon,
  FactoryOutputIcon,
} from './components/peek/icons/OutputInputIcons';
import { FactoryChangeHandler } from './FactoryRow';
import { BaseFactoryUsage, useOutputUsage } from './FactoryUsage';
import { FactoryInput } from './inputs/FactoryInput';
import { FactoryItemInput } from './inputs/FactoryItemInput';
import {
  factoryActions,
  GameFactoryInput,
  WORLD_SOURCE_ID,
} from './store/FactoriesSlice';
import { useIsFactoryVisible } from './useIsFactoryVisible';

export interface IFactoryInputRowProps {
  factoryId: string;
  input: GameFactoryInput;
  index: number;
  onChangeFactory: FactoryChangeHandler;
}

export function FactoryInputRow(props: IFactoryInputRowProps) {
  const { index, input, factoryId, onChangeFactory } = props;
  const dispatch = useDispatch();
  const highlightedOutput = useSelector(
    (state: RootState) => state.factories.present.highlightedOutput,
  );

  const [focused, setFocused] = useState(false);

  const isHighlighted = useMemo(
    () =>
      highlightedOutput?.factoryId === input.factoryId &&
      highlightedOutput?.resource === input.resource,
    [highlightedOutput, input.factoryId, input.resource],
  );

  const sourceOutputs = useSelector(
    (state: RootState) =>
      state.factories.present.factories.find(f => f.id === input.factoryId)
        ?.outputs,
  );

  const allowedItems = useMemo(() => {
    return input.factoryId === WORLD_SOURCE_ID
      ? WorldResourcesList
      : (sourceOutputs?.filter(o => o.resource).map(o => o.resource!) ??
          undefined);
  }, [input.factoryId, sourceOutputs]);

  const usage = useOutputUsage({
    factoryId: input.factoryId,
    output: input.resource,
  });

  const isVisible = useIsFactoryVisible(factoryId, false, input.resource);
  if (!isVisible) return null;

  return (
    <Group
      key={index}
      align="flex-start"
      gap="sm"
      bg={isHighlighted ? 'blue.2' : undefined}
    >
      <FactoryInput
        exceptId={factoryId}
        value={input.factoryId}
        worldSection={
          <Popover width={200} position="bottom-start" withArrow shadow="md">
            <Popover.Target>
              <ActionIcon
                size="sm"
                color="blue"
                variant={input.note ? 'filled' : 'outline'}
                title={input.note ?? 'Add note'}
              >
                <IconWorld size={16} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <TextInput
                size="xs"
                description="Helps to remember where this input is sourced from"
                label="Notes"
                placeholder="Note"
                value={input.note ?? ''}
                onChange={onChangeFactory(factoryId, `inputs[${index}].note`)}
              />
            </Popover.Dropdown>
          </Popover>
        }
        w={180}
        onChange={onChangeFactory(factoryId, `inputs[${index}].factoryId`)}
      />
      <FactoryItemInput
        value={input.resource}
        allowedItems={allowedItems}
        size="sm"
        width={320}
        onChange={onChangeFactory(factoryId, `inputs[${index}].resource`)}
      />
      <Tooltip
        label={
          <Group gap="sm">
            Usage
            {input.factoryId && input.resource ? (
              <BaseFactoryUsage percentage={usage.percentage} />
            ) : (
              'N/A (Choose factory & resource)'
            )}
            {usage.percentage > 1 && (
              <Group gap="sm" align="center">
                Missing {usage.usedAmount - usage.producedAmount}
                <Text size="sm">
                  <FactoryOutputIcon size={16} /> {usage.producedAmount}
                </Text>
                <Text size="sm">
                  <FactoryInputIcon size={16} /> {usage.usedAmount}
                </Text>
              </Group>
            )}
          </Group>
        }
        position="top-start"
        opened={focused}
      >
        <NumberInput
          value={input.amount ?? 0}
          w={100}
          min={0}
          rightSection={
            <FactoryInputIcon
              size={16}
              color={usage.percentage > 1 ? 'red' : undefined}
            />
          }
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          error={
            usage.percentage > 1
              ? `Missing ${usage.usedAmount - usage.producedAmount}`
              : undefined
          }
          onChange={onChangeFactory(factoryId, `inputs[${index}].amount`)}
        />
      </Tooltip>
      <ActionIcon
        variant="outline"
        color="red"
        size="md"
        mt={3}
        onClick={() =>
          dispatch(
            factoryActions.removeInput({
              id: factoryId,
              index,
            }),
          )
        }
      >
        <IconTrash size={16} stroke={1.5} />
      </ActionIcon>
    </Group>
  );
}
