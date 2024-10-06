import {
  Box,
  Button,
  Group,
  LoadingOverlay,
  NumberInput,
  Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconPlus, IconTrash } from '@tabler/icons-react';
import { ReactFlowProvider } from '@xyflow/react';
import moize from 'moize';
import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RootState } from '../../../core/store';
import { FactoryItemInput } from '../../../factories/inputs/FactoryItemInput';
import { AfterHeaderSticky } from '../../../layout/AfterHeaderSticky';
import { solveProduction, useHighs } from '../solveProduction';
import { SolverLayout } from '../SolverLayout';
import { solverActions, usePathSolverInstance } from '../store/SolverSlice';
import { SolverInputOutputsDrawer } from './SolverInputOutputsDrawer';
import { SolverRecipesDrawer } from './SolverRecipesDrawer';

export interface ISolverPageProps {}

export function SolverPage(props: ISolverPageProps) {
  const params = useParams<{ id: string }>();

  const factory = useSelector((state: RootState) => {
    return state.factories.present.factories.find(
      factory => factory.id === params.id,
    );
  });

  const { highsRef, loading } = useHighs();
  const dispatch = useDispatch();

  const instance = usePathSolverInstance();
  useEffect(() => {
    dispatch(solverActions.createIfNoCurrent({})); // TODO Remove
    if (factory) {
      dispatch(solverActions.prepareForFactory({ factory }));
    }
  }, [instance, factory]);

  const navigate = useNavigate();
  const current = useSelector(
    (state: RootState) => state.solver.present.current,
  );

  const onChangeSolver = useCallback(
    moize(
      (path: string) =>
        (
          value: string | null | number | React.ChangeEvent<HTMLInputElement>,
        ) => {
          if (typeof value === 'object' && value?.currentTarget) {
            value = value.currentTarget.value;
          }
          dispatch(solverActions.updateAtPath({ id: params.id, path, value }));
        },
      { maxSize: 100 },
    ),
    [dispatch, params.id],
  );

  const solution = useMemo(() => {
    if (!instance?.request || !highsRef.current || loading) return null;

    const solution = solveProduction(highsRef.current, instance?.request);
    console.log(`Solved -> `, solution);
    return solution;
  }, [instance?.request, loading]);

  if (params.id == null && current != null) {
    // TODO/Debug
    navigate(`/factories/calculator/${current}`);
    return;
  }

  return (
    <Box w="100%" pos="relative">
      <LoadingOverlay visible={loading} />
      {/* <RecipeSolverDemo />
      z */}

      <AfterHeaderSticky>
        <Group gap="sm">
          <SolverRecipesDrawer />
          <SolverInputOutputsDrawer onChangeSolver={onChangeSolver} />
          <Stack gap="sm">
            {factory && (
              <Button
                component={Link}
                to="/factories"
                variant="outline"
                color="gray"
                leftSection={<IconArrowLeft size={16} />}
              >
                All Factories
              </Button>
            )}
            {instance?.request.outputs.map((output, index) => (
              <Group key={index} gap="sm">
                <FactoryItemInput
                  value={output.item}
                  onChange={onChangeSolver(`request.outputs.${index}.item`)}
                  label="Resource"
                  size="sm"
                />
                <NumberInput
                  value={output.amount ?? undefined}
                  onChange={onChangeSolver(`request.outputs.${index}.amount`)}
                  label="Amount"
                  min={0}
                />
                <Button
                  onClick={() => {
                    dispatch(
                      solverActions.updateAtPath({
                        id: instance!.id,
                        path: `request.outputs.${instance.request?.outputs.length ?? 0}`,
                        value: { item: null, amount: null },
                      }),
                    );
                  }}
                >
                  <IconPlus size={16} />
                </Button>
              </Group>
            ))}
          </Stack>
          <Group gap="sm">
            <Button
              color="red"
              variant="subtle"
              onClick={() => {
                dispatch(solverActions.remove({ id: instance!.id }));
                if (factory) {
                  navigate(`/factories`);
                  notifications.show({
                    title: 'Solver removed',
                    message: `Solver for ${factory.name ?? 'factory'} removed`,
                  });
                }
              }}
            >
              <IconTrash size={16} />
            </Button>
          </Group>
        </Group>
      </AfterHeaderSticky>
      {solution && (
        <Stack gap="md">
          <ReactFlowProvider>
            <SolverLayout nodes={solution.nodes} edges={solution.edges} />
          </ReactFlowProvider>
        </Stack>
      )}
    </Box>
  );
}
