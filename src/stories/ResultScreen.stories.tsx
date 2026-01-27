import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ResultScreen } from "@/components/result/ResultScreen";
import { resultVillageWinState, resultWerewolfWinState, resultSwappedState } from "./mocks/gameState";

const success = async () => ({ success: true as const });

const meta = {
  title: "Screens/ResultScreen",
  component: ResultScreen,
  parameters: { layout: "fullscreen" },
  args: {
    onPlayAgain: fn(success),
  },
} satisfies Meta<typeof ResultScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VillageWin: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: resultVillageWinState,
  },
};

export const WerewolfWin: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: resultWerewolfWinState,
  },
};

export const Swapped: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: resultSwappedState,
  },
};
