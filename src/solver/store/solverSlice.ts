import { getAllDefaultRecipesIds } from '@/recipes/FactoryRecipe';
import { createSlice } from '../../core/zustand-helpers/slices';
import { SolverInstance } from './Solver';

export interface SolversSlice {
  current: string | null;
  instances: Record<string, SolverInstance>;
}

export const solversSlice = createSlice({
  name: 'solvers',
  value: {
    // TODO Remove current
    current: null,
    instances: {},
  } as SolversSlice,
  actions: {
    updateSolver:
      (id: string, fn: (solver: SolverInstance) => void) => state => {
        fn(state.instances[id]);
      },
    createSolver: (id: string) => state => {
      state.instances[id] = {
        id,
        isFactory: false,
        isOwner: true,
        request: {
          allowedRecipes: getAllDefaultRecipesIds(),
          objective: 'minimize_resources',
        },
      };
      console.log(
        'Creating solver',
        id,
        'recipes=',
        state.instances[id].request.allowedRecipes,
      );
    },
    removeSolver: (id: string) => state => {
      delete state.instances[id];
    },
    saveSolverSharedId: (id: string, sharedId: string) => state => {
      state.instances[id].sharedId = sharedId;
    },
    loadSharedSolver:
      (
        instance: SolverInstance,
        data: {
          isOwner: boolean;
          localId: string;
        },
      ) =>
      state => {
        const { isOwner, localId } = data;
        state.instances[localId] = instance;
        if (!isOwner) {
          state.instances[localId].sharedId = undefined; // We need to unlink the shared instance
          state.instances[localId].isOwner = false;
          state.instances[localId].isFactory = false;
          state.instances[localId].remoteSharedId = instance.sharedId;
        }
      },
  },
});
