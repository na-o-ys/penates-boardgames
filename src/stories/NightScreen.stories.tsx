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
  nightMadmanState,
  nightCiaState,
  nightBakerState,
  nightAlphaWolfState,
  nightAlphaWolfWithFellowsState,
  nightActedState,
  nightActedSeerCenterState,
  nightActedRobberState,
  nightReceivedBreadState,
  nightWhiteRobberState,
  nightReceivedNoticeState,
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
    roomState: nightSeerState,
  },
};

export const Werewolf: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightWerewolfState,
  },
};

export const WerewolfWithFellows: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightWerewolfWithFellowsState,
  },
};

export const Robber: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightRobberState,
  },
};

export const Troublemaker: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightTroublemakerState,
  },
};

export const Hunter: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightHunterState,
  },
};

export const Villager: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightVillagerState,
  },
};

export const Tanner: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightTannerState,
  },
};

export const Madman: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightMadmanState,
  },
};

export const CIA: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightCiaState,
  },
};

export const Baker: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightBakerState,
  },
};

export const AlphaWolf: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightAlphaWolfState,
  },
};

export const AlphaWolfWithFellows: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightAlphaWolfWithFellowsState,
  },
};

export const Acted: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightActedState,
  },
};

export const ActedRobber: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightActedRobberState,
  },
};

export const ResultSeerPlayer: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightActedState,
    initialPendingResult: { type: "SEER_LOOK_PLAYER", targets: ["p2"] },
  },
};

export const ResultSeerCenter: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightActedSeerCenterState,
    initialPendingResult: { type: "SEER_LOOK_CENTER", targets: ["CENTER_0", "CENTER_1"] },
  },
};

export const ResultRobber: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightActedRobberState,
    initialPendingResult: { type: "ROBBER_SWAP", targets: ["p2"] },
  },
};

export const ReceivedBread: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightReceivedBreadState,
  },
};

export const WhiteRobber: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightWhiteRobberState,
  },
};

export const ReceivedNotice: Story = {
  args: {
    roomId: "test-room-id",
    playerId: "p1",
    roomState: nightReceivedNoticeState,
  },
};
