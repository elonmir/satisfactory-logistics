import {
  useFactoryInputsOutputs,
  useFactorySimpleAttributes,
} from '@/factories/store/factoriesSelectors';
import { Path, setByPath } from '@clickbar/dot-diver';
import {
  Box,
  Button,
  Container,
  Group,
  LoadingOverlay,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconArrowLeft,
  IconTrash,
  IconZoomExclamation,
} from '@tabler/icons-react';
import { Edge, Node, Panel, ReactFlowProvider } from '@xyflow/react';
import Graph from 'graphology';
import { HighsSolution } from 'highs';
import { useCallback, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { v4 } from 'uuid';
import { useFormOnChange } from '../../core/form/useFormOnChange';
import { useStore } from '../../core/zustand';
import { AfterHeaderSticky } from '../../layout/AfterHeaderSticky';
import { SolverEdge, SolverNode } from '../computeProductionConstraints';
import { IMachineNodeData } from '../layout/MachineNode';
import { IResourceNodeData } from '../layout/ResourceNode';
import { SolverShareButton } from '../share/SolverShareButton';
import { solveProduction, useHighs } from '../solveProduction';
import { SolverLayout } from '../SolverLayout';
import { SolverInstance } from '../store/Solver';
import { usePathSolverInstance } from '../store/solverSelectors';
import { SolverInputOutputsDrawer } from './SolverInputOutputsDrawer';
import { SolverRecipesDrawer } from './SolverRecipesDrawer';
import { SolverSummaryDrawer } from './summary/SolverSummaryDrawer';

export interface ISolverPageProps {}

export interface ISolverSolution {
  result: HighsSolution;
  nodes: Array<Node<IMachineNodeData | IResourceNodeData>>;
  edges: Edge[];
  graph: Graph<SolverNode, SolverEdge, any>;
}

export function SolverPage(props: ISolverPageProps) {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { highsRef, loading } = useHighs();
  const navigate = useNavigate();

  const factory = useFactorySimpleAttributes(id);
  const inputsOutputs = useFactoryInputsOutputs(id);
  const instance = usePathSolverInstance();

  // TODO We want to have a "default" solver ID you can edit how
  // many times you want, but if you don't save it, it will be
  // overwritten by a new one.
  useEffect(() => {
    if (params.id && (!instance || !factory)) {
      console.log('SolverPage: No instance or factory, creating', id);
      useStore.getState().upsertFactorySolver(id);
    }

    if (!params.id) {
      const nextId = v4();
      useStore.getState().upsertFactorySolver(nextId, {
        outputs: [
          {
            resource: 'Desc_Cement_C',
            amount: 60,
          },
        ],
      });
      navigate(`/factories/${nextId}/calculator`);
    }
  }, [instance, factory, id, params.id, navigate]);

  console.log('SolverPage', instance);

  const updater = useCallback(
    (path: Path<SolverInstance>, value: string | null | number) => {
      useStore.getState().updateSolver(id!, state => {
        setByPath(state, path, value);
      });
    },
    [id],
  );

  const onChangeHandler = useFormOnChange<SolverInstance>(updater);

  const solution = useMemo(() => {
    if (!instance?.request || !highsRef.current || loading) return null;

    const solution = solveProduction(highsRef.current, {
      ...instance?.request,
      ...inputsOutputs,
    });
    console.log(`Solved -> `, solution);
    return solution;
  }, [highsRef, instance?.request, inputsOutputs, loading]);

  // TODO Implemente auto-create on navigate
  // if (params.id == null && current != null) {
  //   // TODO/Debug
  //   navigate(`/factories/calculator/${current}`);
  //   return;
  // }

  const hasSolution =
    solution &&
    solution.result.Status === 'Optimal' &&
    solution?.nodes.length > 0;
  console.log('hasSolution', hasSolution, solution);
  return (
    <Box w="100%" pos="relative">
      <LoadingOverlay visible={loading} />
      {/* <RecipeSolverDemo />
      z */}

      <AfterHeaderSticky>
        <Group gap="sm" justify="space-between">
          <Group gap="sm">
            {factory && (
              <>
                <Button
                  component={Link}
                  to="/factories"
                  variant="outline"
                  color="gray"
                  leftSection={<IconArrowLeft size={16} />}
                >
                  All Factories
                </Button>
                <Title order={4}>{factory.name ?? 'Factory'}</Title>
              </>
            )}
          </Group>
          <Group gap="sm">
            <SolverInputOutputsDrawer id={id} />
            <Select
              data={[
                { value: 'minimize_resources', label: 'Minimize Resources' },
                { value: 'minimize_power', label: 'Minimize Power' },
                { value: 'minimize_area', label: 'Minimize Area' },
                // TODO Centralize defs
              ]}
              placeholder="Objective"
              value={instance?.request?.objective ?? 'minimize_resources'}
              onChange={onChangeHandler('request.objective')}
            />
            <SolverRecipesDrawer />

            <Button
              // TODO Show this button only if the solver is not from a _saved_ factory=
              color="red"
              variant="light"
              onClick={() => {
                useStore.getState().removeSolver(id!);
                if (factory) {
                  navigate(`/factories`);
                  notifications.show({
                    title: 'Solver removed',
                    message: `Solver for ${factory.name ?? 'factory'} removed`,
                  });
                } else {
                  navigate(`/factories/calculator`);
                  notifications.show({
                    title: 'Solver removed',
                    message: `Solver removed`,
                  });
                }
              }}
              leftSection={<IconTrash size={16} />}
            >
              Reset
            </Button>
          </Group>
        </Group>
      </AfterHeaderSticky>
      {solution && hasSolution && (
        <Stack gap="md">
          <ReactFlowProvider>
            <SolverLayout nodes={solution.nodes} edges={solution.edges}>
              <Panel>
                <Group gap="xs">
                  <SolverSummaryDrawer solution={solution} />
                  <SolverShareButton />
                </Group>
              </Panel>
            </SolverLayout>
          </ReactFlowProvider>
        </Stack>
      )}
      {!hasSolution && (
        <Container size="lg" mt="lg">
          <Stack gap="xs" align="center" mih={200} mt={60} mb={90}>
            <IconZoomExclamation size={64} stroke={1.2} />
            <Text fz="h2">No results found</Text>
            <Text size="sm" c="dark.2">
              No solution found for the given parameters. Try adjusting the
              inputs, outputs and available recipes.
            </Text>
          </Stack>
        </Container>
      )}
    </Box>
  );
}
