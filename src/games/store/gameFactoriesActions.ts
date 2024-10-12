import { v4 } from 'uuid';
import { useStore } from '../../core/zustand';
import { createActions } from '../../core/zustand-helpers/actions';
import { Factory } from '../../factories/Factory';
import { Game } from '../Game';

export const gameFactoriesActions = createActions({
  initGame: (game: Partial<Game>) => state => {
    const gameId = v4();
    const factoryId = v4();
    state.games.selected = gameId;
    state.factories.factories[factoryId] = {
      id: factoryId,
      // name: 'New Factory',
      inputs: [],
      outputs: [],
    };
    state.games.games[gameId] = {
      id: gameId,
      name: 'New Game',
      createdAt: new Date(),
      settings: {
        noHighlight100PercentUsage: false,
        highlight100PercentColor: '#339af0',
      },
      ...game,
      factoriesIds: [factoryId],
    };
  },
  addGameFactory:
    (gameId?: string | null, factory?: Partial<Omit<Factory, 'id'>>) =>
    state => {
      const factoryId = v4();
      state.factories.factories[factoryId] = {
        id: factoryId,
        inputs: [],
        outputs: [],
        ...factory,
      };

      const targetId = gameId ?? state.games.selected;
      if (!targetId) {
        throw new Error('No game selected');
      }

      state.games.games[targetId].factoriesIds.push(factoryId);
    },
  // TODO For now only for selected game
  removeGameFactory: (factoryId: string) => state => {
    const index =
      state.games.games[state.games.selected!].factoriesIds.indexOf(factoryId);
    state.games.games[state.games.selected!].factoriesIds.splice(index, 1);
    delete state.factories.factories[factoryId];
  },
  // TODO Handle pre-v0.3.0 factories? Add "version" field?
  loadGame: (serialized: SerializedGame) => state => {
    state.games.selected = serialized.game.id;
    state.games.games[serialized.game.id] = serialized.game;
    serialized.factories.forEach(factory => {
      state.factories.factories[factory.id] = factory;
    });
  },
  setSavedGameId: (gameId: string, savedId: string) => state => {
    state.games.games[gameId].savedId = savedId;
  },
});

export type SerializedGame = {
  game: Game;
  factories: Factory[];
};

export function serializeGame(gameId: string | null | undefined) {
  const state = useStore.getState();
  const game = state.games.games[gameId ?? state.games.selected ?? ''];
  if (!game) {
    throw new Error('Game not found');
  }
  return {
    game,
    factories: game?.factoriesIds.map(
      factoryId => state.factories.factories[factoryId],
    ),
  };
}
