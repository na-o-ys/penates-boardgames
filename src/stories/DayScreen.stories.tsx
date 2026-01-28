import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { DayScreen } from "@/components/day/DayScreen";
import { dayNormalState, dayRobberSwapState, dayReceivedBreadState } from "./mocks/gameState";

const success = async () => ({ success: true as const });

const meta = {
  title: "Screens/DayScreen",
  component: DayScreen,
  parameters: { layout: "fullscreen" },
  args: {
    onAdvancePhase: fn(success),
  },
} satisfies Meta<typeof DayScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: dayNormalState,
  },
};

export const RobberSwap: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: dayRobberSwapState,
  },
};

export const ReceivedBread: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: dayReceivedBreadState,
  },
};
