import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { NightScreen } from "@/components/night/NightScreen";
import {
  nightSeerState,
  nightWerewolfState,
  nightWerewolfWithFellowsState,
  nightRobberState,
  nightTroublemakerState,
  nightHunterState,
  nightVillagerState,
  nightTannerState,
  nightActedState,
} from "./mocks/gameState";

const success = async () => ({ success: true as const });

const meta = {
  title: "Screens/NightScreen",
  component: NightScreen,
  parameters: { layout: "fullscreen" },
  args: {
    onSubmitAction: fn(success),
    onAutoSkip: fn(success),
  },
} satisfies Meta<typeof NightScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Seer: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: nightSeerState,
  },
};

export const Werewolf: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: nightWerewolfState,
  },
};

export const WerewolfWithFellows: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: nightWerewolfWithFellowsState,
  },
};

export const Robber: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: nightRobberState,
  },
};

export const Troublemaker: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: nightTroublemakerState,
  },
};

export const Hunter: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: nightHunterState,
  },
};

export const Villager: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: nightVillagerState,
  },
};

export const Tanner: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: nightTannerState,
  },
};

export const Acted: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    gameState: nightActedState,
  },
};
