import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { HunterRevengeScreen } from "@/components/hunter/HunterRevengeScreen";
import {
  hunterRevengeExecutedState,
  hunterRevengeWaitingState,
  hunterRevengeChosenState,
} from "./mocks/gameState";

const success = async () => ({ success: true as const });

const meta = {
  title: "Screens/HunterRevengeScreen",
  component: HunterRevengeScreen,
  parameters: { layout: "fullscreen" },
  args: {
    onSubmitRevenge: fn(success),
    onAutoRevenge: fn(success),
  },
} satisfies Meta<typeof HunterRevengeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ExecutedHunter: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: hunterRevengeExecutedState,
  },
};

export const Waiting: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: hunterRevengeWaitingState,
  },
};

export const Chosen: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: hunterRevengeChosenState,
  },
};
