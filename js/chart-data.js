/**
 * 知识库图表数据 - 从 UE_Networking_Visualization.html 提取
 * 包含 9 个视图的完整图表数据
 */
window.VIBE_CHARTS = {

  // === 1. 三种同步方案总览 ===
  "chart-ue-net-overview-001": {
    type: "graph",
    title: "UE 网络同步方案对比",
    nodes: [
      { id: "game", x: 600, y: 60, label: "游戏逻辑 (AActor / UActorComponent)", color: "#4a68b3", w: 220, h: 44 },
      { id: "native", x: 200, y: 200, label: "① 原生 Replication\n(UNetDriver + ActorChannel)", color: "#c47f3d", w: 220, h: 60 },
      { id: "repgraph", x: 600, y: 200, label: "② ReplicationGraph\n(空间/兴趣分片)", color: "#4d8f9c", w: 220, h: 60 },
      { id: "iris", x: 1000, y: 200, label: "③ Iris ReplicationSystem\n(UE5 新一代 Experimental)", color: "#8b5db8", w: 220, h: 60 },
      { id: "n_netdriver", x: 60, y: 340, label: "UNetDriver", color: "#c47f3d", w: 170, h: 38 },
      { id: "n_conn", x: 60, y: 400, label: "UNetConnection", color: "#c47f3d", w: 170, h: 38 },
      { id: "n_channel", x: 60, y: 460, label: "UActorChannel", color: "#c47f3d", w: 170, h: 38 },
      { id: "n_replayout", x: 60, y: 520, label: "FRepLayout", color: "#2fa66b", w: 170, h: 38 },
      { id: "rg_graph", x: 490, y: 340, label: "UReplicationGraph", color: "#4d8f9c", w: 170, h: 38 },
      { id: "rg_node", x: 490, y: 400, label: "UReplicationGraphNode", color: "#4d8f9c", w: 170, h: 38 },
      { id: "rg_gather", x: 490, y: 460, label: "GatherActorListsForConnection", color: "#4d8f9c", w: 170, h: 38 },
      { id: "rg_channel", x: 490, y: 520, label: "（复用）UActorChannel + FRepLayout", color: "#c47f3d", w: 170, h: 38 },
      { id: "i_system", x: 920, y: 340, label: "UReplicationSystem", color: "#8b5db8", w: 170, h: 38 },
      { id: "i_bridge", x: 920, y: 400, label: "UObjectReplicationBridge", color: "#8b5db8", w: 170, h: 38 },
      { id: "i_desc", x: 920, y: 460, label: "FReplicationStateDescriptor", color: "#2fa66b", w: 170, h: 38 },
      { id: "i_writer", x: 920, y: 520, label: "ReplicationWriter / Reader", color: "#a44", w: 170, h: 38 }
    ],
    edges: [
      { from: "game", to: "native", label: "Replicated" },
      { from: "game", to: "repgraph", label: "Replicated" },
      { from: "game", to: "iris", label: "Replicated" },
      { from: "native", to: "n_netdriver" },
      { from: "n_netdriver", to: "n_conn" },
      { from: "n_conn", to: "n_channel" },
      { from: "n_channel", to: "n_replayout" },
      { from: "repgraph", to: "rg_graph" },
      { from: "rg_graph", to: "rg_node" },
      { from: "rg_node", to: "rg_gather" },
      { from: "rg_gather", to: "rg_channel" },
      { from: "iris", to: "i_system" },
      { from: "i_system", to: "i_bridge" },
      { from: "i_bridge", to: "i_desc" },
      { from: "i_desc", to: "i_writer" }
    ]
  },

  // === 2. 原生同步完整数据流 ===
  "chart-ue-native-repl-002": {
    type: "graph",
    title: "① 原生同步 · 完整数据流",
    nodes: [
      { id: "user", x: 80, y: 80, w: 220, h: 50, label: "开发者代码\nUPROPERTY(Replicated) / RPC", color: "#4a68b3" },
      { id: "preplication", x: 80, y: 180, w: 220, h: 40, label: "AActor::PreReplication", color: "#c47f3d" },
      { id: "sra", x: 80, y: 250, w: 220, h: 50, label: "UNetDriver::\nServerReplicateActors", color: "#c47f3d" },
      { id: "consider", x: 80, y: 330, w: 220, h: 40, label: "BuildConsiderList\n(所有活跃 Actor)", color: "#c47f3d" },
      { id: "priorit", x: 80, y: 400, w: 220, h: 40, label: "PrioritizeActors\n(NetPriority × 距离)", color: "#c47f3d" },
      { id: "chan", x: 400, y: 250, w: 220, h: 50, label: "UActorChannel::\nReplicateActor()", color: "#c47f3d" },
      { id: "objrepl", x: 400, y: 340, w: 220, h: 40, label: "FObjectReplicator::\nReplicateProperties", color: "#2fa66b" },
      { id: "replayout", x: 400, y: 420, w: 220, h: 50, label: "FRepLayout\n(反射生成的字段布局)", color: "#2fa66b" },
      { id: "bunch", x: 720, y: 250, w: 220, h: 50, label: "FOutBunch\n(通道级消息包)", color: "#2fa66b" },
      { id: "sendbunch", x: 720, y: 340, w: 220, h: 50, label: "UChannel::SendBunch", color: "#a44" },
      { id: "flushnet", x: 720, y: 430, w: 220, h: 50, label: "UNetConnection::FlushNet\n(打包 UDP Packet)", color: "#a44" },
      { id: "recv", x: 400, y: 530, w: 220, h: 50, label: "UNetConnection::ReceivedPacket", color: "#a44" },
      { id: "processbunch", x: 80, y: 530, w: 220, h: 50, label: "UActorChannel::ProcessBunch", color: "#c47f3d" }
    ],
    edges: [
      { from: "user", to: "preplication" },
      { from: "preplication", to: "sra" },
      { from: "sra", to: "consider" },
      { from: "consider", to: "priorit" },
      { from: "priorit", to: "chan" },
      { from: "chan", to: "objrepl" },
      { from: "objrepl", to: "replayout" },
      { from: "replayout", to: "bunch" },
      { from: "bunch", to: "sendbunch" },
      { from: "sendbunch", to: "flushnet" },
      { from: "flushnet", to: "recv" },
      { from: "recv", to: "processbunch" }
    ]
  },

  // === 3. ReplicationGraph 空间分片架构 ===
  "chart-ue-repgraph-003": {
    type: "graph",
    title: "② ReplicationGraph · 空间分片架构",
    nodes: [
      { id: "init", x: 80, y: 80, w: 260, h: 50, label: "UReplicationGraph::InitGlobalGraphNodes\n(启动时构建 Graph 拓扑)", color: "#4d8f9c" },
      { id: "add", x: 80, y: 170, w: 260, h: 50, label: "RouteAddNetworkActorToNodes\n(Actor 注册到 Node)", color: "#4d8f9c" },
      { id: "grid", x: 400, y: 130, w: 260, h: 60, label: "Node_GridSpatialization2D\n(把地图切成 N×N 格)", color: "#4d8f9c" },
      { id: "dorm", x: 400, y: 220, w: 260, h: 60, label: "Node_DormancyNode\n(休眠 Actor 只在唤醒时同步)", color: "#4d8f9c" },
      { id: "always", x: 400, y: 310, w: 260, h: 60, label: "Node_AlwaysRelevant_ForConnection\n(每个连接自己的 PC/Pawn)", color: "#4d8f9c" },
      { id: "freq", x: 400, y: 400, w: 260, h: 60, label: "Node_DynamicSpatialFrequency\n(远处降频)", color: "#4d8f9c" },
      { id: "sra", x: 720, y: 130, w: 260, h: 60, label: "UReplicationGraph::ServerReplicateActors\n(重写主循环)", color: "#4d8f9c" },
      { id: "gather", x: 720, y: 230, w: 260, h: 60, label: "GatherActorListsForConnection\n(关键剪枝点)", color: "#4d8f9c" },
      { id: "send", x: 720, y: 330, w: 260, h: 60, label: "（复用）UActorChannel + FRepLayout\n实际序列化和发包", color: "#c47f3d" },
      { id: "gain", x: 720, y: 430, w: 260, h: 80, label: "✨ 性能收益\nO(N×M) → 近似 O(k×M)", color: "#5b7bd8" }
    ],
    edges: [
      { from: "init", to: "grid" }, { from: "init", to: "dorm" }, { from: "init", to: "always" }, { from: "init", to: "freq" },
      { from: "add", to: "grid" }, { from: "add", to: "dorm" }, { from: "add", to: "always" }, { from: "add", to: "freq" },
      { from: "grid", to: "sra" }, { from: "dorm", to: "sra" }, { from: "always", to: "sra" }, { from: "freq", to: "sra" },
      { from: "sra", to: "gather" }, { from: "gather", to: "send" }, { from: "send", to: "gain" }
    ]
  },

  // === 4. Iris 现代化数据驱动同步 ===
  "chart-ue-iris-004": {
    type: "graph",
    title: "③ Iris · 现代化数据驱动同步",
    nodes: [
      { id: "reg", x: 80, y: 80, w: 280, h: 50, label: "UObjectReplicationBridge::BeginReplication\n注册 UObject → FNetRefHandle", color: "#8b5db8" },
      { id: "desc", x: 80, y: 180, w: 280, h: 60, label: "FReplicationStateDescriptorBuilder\n(编译期生成属性布局)", color: "#2fa66b" },
      { id: "mark", x: 80, y: 290, w: 280, h: 60, label: "MarkDirty(Handle) + ChangeMask\n(Push Model 增量位图)", color: "#8b5db8" },
      { id: "presend", x: 400, y: 80, w: 260, h: 60, label: "ReplicationSystem::PreSendUpdate(Δ)\n(过滤 + 优先级 + Poll)", color: "#8b5db8" },
      { id: "filter", x: 400, y: 190, w: 260, h: 60, label: "NetObjectFilter\n(可插拔过滤器)", color: "#8b5db8" },
      { id: "prio", x: 400, y: 300, w: 260, h: 60, label: "NetObjectPrioritizer\n(带宽紧张时的排序)", color: "#8b5db8" },
      { id: "writer", x: 720, y: 80, w: 260, h: 60, label: "ReplicationWriter\n(写 Bit Stream)", color: "#a44" },
      { id: "ds", x: 720, y: 190, w: 260, h: 60, label: "DataStreamManager\n(丢包 / 重传 / 优先级流)", color: "#a44" },
      { id: "send", x: 720, y: 300, w: 260, h: 60, label: "SendUpdate(SendFn)\n(实际交给下层网络)", color: "#8b5db8" },
      { id: "reader", x: 720, y: 410, w: 260, h: 60, label: "ReplicationReader (客户端)", color: "#a44" },
      { id: "post", x: 400, y: 410, w: 260, h: 60, label: "PostSendUpdate\n(清 ChangeMask, 记录 ACK 依赖)", color: "#8b5db8" },
      { id: "gain", x: 80, y: 410, w: 280, h: 100, label: "✨ Iris 相对原生的优势", color: "#5b7bd8" }
    ],
    edges: [
      { from: "reg", to: "desc" }, { from: "desc", to: "mark" },
      { from: "mark", to: "presend" }, { from: "presend", to: "filter" }, { from: "filter", to: "prio" },
      { from: "prio", to: "writer" }, { from: "writer", to: "ds" }, { from: "ds", to: "send" }, { from: "send", to: "reader" },
      { from: "prio", to: "post" }, { from: "presend", to: "gain" }
    ]
  },

  // === 5. RPC 完整数据流 ===
  "chart-ue-rpc-005": {
    type: "graph",
    title: "RPC 完整数据流",
    nodes: [
      { id: "call", x: 60, y: 80, w: 260, h: 60, label: "游戏代码：\nActor->ServerXXX(params)", color: "#4a68b3" },
      { id: "callremote", x: 60, y: 180, w: 260, h: 50, label: "AActor::CallRemoteFunction", color: "#c47f3d" },
      { id: "processremote", x: 60, y: 270, w: 260, h: 60, label: "UNetDriver::ProcessRemoteFunction", color: "#c47f3d" },
      { id: "internal", x: 60, y: 370, w: 260, h: 60, label: "InternalProcessRemoteFunctionPrivate", color: "#c47f3d" },
      { id: "chanprivate", x: 400, y: 80, w: 260, h: 70, label: "ProcessRemoteFunctionForChannelPrivate\n(RPC 打包核心)", color: "#c47f3d" },
      { id: "replayoutrpc", x: 400, y: 190, w: 260, h: 60, label: "FRepLayout::SendPropertiesForRPC\n(参数序列化)", color: "#2fa66b" },
      { id: "writeblock", x: 400, y: 290, w: 260, h: 70, label: "WriteFieldHeaderAndPayload\n+ WriteContentBlockPayload", color: "#2fa66b" },
      { id: "queue", x: 400, y: 390, w: 260, h: 60, label: "⚡ Multicast Unreliable → \n先 QueueRemoteFunctionBunch", color: "#5b7bd8" },
      { id: "sendbunch", x: 730, y: 80, w: 260, h: 60, label: "UActorChannel::SendBunch\n(交给 UNetConnection)", color: "#a44" },
      { id: "flush", x: 730, y: 180, w: 260, h: 60, label: "FlushNet → UDP Send", color: "#a44" },
      { id: "recvpacket", x: 730, y: 290, w: 260, h: 60, label: "客户端 UIpNetDriver::TickDispatch", color: "#a44" },
      { id: "recvbunch", x: 730, y: 390, w: 260, h: 60, label: "UActorChannel::ReceivedRawBunch\n→ ProcessBunch", color: "#c47f3d" },
      { id: "validate", x: 730, y: 490, w: 260, h: 60, label: "（Server RPC）\nServerXXX_Validate 校验", color: "#5b7bd8" }
    ],
    edges: [
      { from: "call", to: "callremote" }, { from: "callremote", to: "processremote" }, { from: "processremote", to: "internal" },
      { from: "internal", to: "chanprivate" }, { from: "chanprivate", to: "replayoutrpc" }, { from: "replayoutrpc", to: "writeblock" },
      { from: "writeblock", to: "queue" }, { from: "writeblock", to: "sendbunch" },
      { from: "sendbunch", to: "flush" }, { from: "flush", to: "recvpacket" }, { from: "recvpacket", to: "recvbunch" }, { from: "recvbunch", to: "validate" }
    ]
  },

  // === 6. 属性同步完整数据流 ===
  "chart-ue-proprep-006": {
    type: "graph",
    title: "属性同步 (Property Replication) 完整数据流",
    nodes: [
      { id: "decl", x: 60, y: 60, w: 260, h: 60, label: "类声明：\nUPROPERTY(ReplicatedUsing=OnRep_HP)\nfloat HP;", color: "#4a68b3" },
      { id: "layout", x: 60, y: 170, w: 260, h: 60, label: "FRepLayout::InitFromClass\n(反射生成布局，一次性)", color: "#2fa66b" },
      { id: "setter", x: 60, y: 280, w: 260, h: 60, label: "游戏运行时：\n服务器代码 HP -= 10", color: "#4a68b3" },
      { id: "sra", x: 400, y: 60, w: 280, h: 60, label: "UNetDriver::ServerReplicateActors\n(每 Tick, ServerTickTime 决定频率)", color: "#c47f3d" },
      { id: "consider", x: 400, y: 170, w: 280, h: 60, label: "BuildConsiderList\n筛选 NextUpdateTime 到期的 Actor", color: "#c47f3d" },
      { id: "per_conn", x: 400, y: 280, w: 280, h: 60, label: "For each UNetConnection:\n  IsRelevant + PrioritizeActors", color: "#c47f3d" },
      { id: "chan", x: 730, y: 60, w: 280, h: 70, label: "UActorChannel::ReplicateActor\n(单 Actor 单次同步)", color: "#c47f3d" },
      { id: "diff", x: 730, y: 180, w: 280, h: 70, label: "FRepLayout::DiffProperties\n对比 Shadow State (上次值)", color: "#2fa66b" },
      { id: "send", x: 730, y: 300, w: 280, h: 60, label: "FRepLayout::SendProperties\n只写脏字段的 handle + 值", color: "#2fa66b" },
      { id: "bunch", x: 730, y: 410, w: 280, h: 60, label: "FOutBunch → SendBunch → Packet", color: "#a44" },
      { id: "clientrecv", x: 400, y: 410, w: 280, h: 60, label: "客户端 ProcessBunch → \nFRepLayout::ReceiveProperties", color: "#c47f3d" },
      { id: "onrep", x: 60, y: 410, w: 280, h: 60, label: "触发 OnRep_XXX 回调", color: "#5b7bd8" },
      { id: "note1", x: 60, y: 520, w: 600, h: 70, label: "💡 关键优化：Shadow State + Handle 编号\n没变的属性完全不写字节；变了也只写 handle 而非属性名", color: "#5b7bd8" }
    ],
    edges: [
      { from: "decl", to: "layout" }, { from: "setter", to: "sra" }, { from: "sra", to: "consider" }, { from: "consider", to: "per_conn" },
      { from: "per_conn", to: "chan" }, { from: "chan", to: "diff" }, { from: "diff", to: "send" }, { from: "send", to: "bunch" },
      { from: "bunch", to: "clientrecv" }, { from: "clientrecv", to: "onrep" },
      { from: "layout", to: "diff" }, { from: "layout", to: "clientrecv" }
    ]
  },

  // === 7. 时序图 · 属性同步三端 ===
  "chart-ue-seq-proprep-007": {
    type: "sequence",
    title: "🕐 时序图 · 属性同步 (Authority ↔ AutonomousProxy ↔ SimulatedProxy)",
    lanes: [
      { id: "authority", label: "🏛 Authority (DS 主控/服务端)", color: "#a44", x: 200 },
      { id: "autonomous", label: "🎮 AutonomousProxy (本地玩家客户端)", color: "#4a68b3", x: 700 },
      { id: "simulated", label: "👀 SimulatedProxy (其他玩家客户端)", color: "#4d8f9c", x: 1200 }
    ],
    messages: [
      { from: "authority", to: "authority", y: 100, kind: "internal", label: "Gameplay 逻辑改属性: HP -= 10" },
      { from: "authority", to: "authority", y: 150, kind: "internal", label: "UWorld::Tick → UNetDriver::TickFlush" },
      { from: "authority", to: "authority", y: 200, kind: "internal", label: "ServerReplicateActors → BuildConsiderList → PrioritizeActors" },
      { from: "authority", to: "authority", y: 250, kind: "internal", label: "FRepLayout::DiffProperties (对比 Shadow State)" },
      { from: "authority", to: "autonomous", y: 330, kind: "rpc", label: "📦 Bunch 属性同步 (含 COND_OwnerOnly)" },
      { from: "autonomous", to: "autonomous", y: 400, kind: "internal", label: "ProcessBunch → ReceiveProperties (直接写内存) → OnRep_XXX" },
      { from: "authority", to: "simulated", y: 470, kind: "rpc", label: "📦 Bunch 属性同步 (剔除 OwnerOnly)" },
      { from: "simulated", to: "simulated", y: 540, kind: "internal", label: "ProcessBunch → 应用属性 → 触发插值 (SmoothCorrection)" },
      { from: "authority", to: "simulated", y: 640, kind: "note", label: "📝 关键差异总结：NetRole 状态机 + Replication Condition + 客户端处理差异" }
    ]
  },

  // === 8. 时序图 · RPC 三方向 ===
  "chart-ue-seq-rpc-008": {
    type: "sequence",
    title: "🕐 时序图 · RPC 三个方向 (Server / Client / Multicast)",
    lanes: [
      { id: "authority", label: "🏛 Authority (DS)", color: "#a44", x: 200 },
      { id: "autonomous", label: "🎮 AutonomousProxy (拥有者客户端)", color: "#4a68b3", x: 700 },
      { id: "simulated", label: "👀 SimulatedProxy (旁观客户端)", color: "#4d8f9c", x: 1200 }
    ],
    messages: [
      { from: "authority", to: "simulated", y: 60, kind: "note", label: "━━━━━ ① Server RPC (客户端 → 服务端) ━━━━━" },
      { from: "autonomous", to: "autonomous", y: 140, kind: "internal", label: "游戏代码: MyPawn->ServerFire() (进入 UHT 生成的 thunk)" },
      { from: "autonomous", to: "authority", y: 220, kind: "rpc", label: "🔴 Reliable Bunch (含 FieldNetIndex + 参数)" },
      { from: "authority", to: "authority", y: 290, kind: "internal", label: "ProcessBunch → ClassCache 查 UFunction → ServerFire_Validate" },
      { from: "authority", to: "authority", y: 360, kind: "internal", label: "ProcessEvent → ServerFire_Implementation (真正业务逻辑)" },
      { from: "authority", to: "simulated", y: 450, kind: "note", label: "━━━━━ ② Client RPC (服务端 → 单个拥有者客户端) ━━━━━" },
      { from: "authority", to: "authority", y: 520, kind: "internal", label: "服务端: MyPC->ClientShowDamage(50)" },
      { from: "authority", to: "autonomous", y: 590, kind: "rpc", label: "📨 Client RPC Bunch" },
      { from: "autonomous", to: "autonomous", y: 660, kind: "internal", label: "ProcessBunch → ClientShowDamage_Implementation" },
      { from: "authority", to: "simulated", y: 750, kind: "note", label: "━━━━━ ③ NetMulticast RPC (服务端 → 所有相关客户端) ━━━━━" },
      { from: "authority", to: "authority", y: 820, kind: "internal", label: "服务端: Bomb->MulticastPlayExplosion() 遍历所有 Connections" },
      { from: "authority", to: "autonomous", y: 900, kind: "rpc", label: "📢 Multicast Bunch → AutonomousProxy" },
      { from: "authority", to: "simulated", y: 970, kind: "rpc", label: "📢 Multicast Bunch → SimulatedProxy" },
      { from: "autonomous", to: "autonomous", y: 1040, kind: "internal", label: "MulticastPlayExplosion_Implementation (播放爆炸特效)" },
      { from: "simulated", to: "simulated", y: 1110, kind: "internal", label: "MulticastPlayExplosion_Implementation" }
    ]
  },

  // === 9. 时序图 · 移动预测与修正 ===
  "chart-ue-seq-move-009": {
    type: "sequence",
    title: "🕐 时序图 · 移动预测 + 服务器修正 (教科书级三方交互)",
    lanes: [
      { id: "authority", label: "🏛 Authority (DS 权威)", color: "#a44", x: 200 },
      { id: "autonomous", label: "🎮 AutonomousProxy (自己控制的 Pawn)", color: "#4a68b3", x: 700 },
      { id: "simulated", label: "👀 SimulatedProxy (别人看到的 Pawn)", color: "#4d8f9c", x: 1200 }
    ],
    messages: [
      { from: "authority", to: "simulated", y: 62, kind: "note", label: "━━━━━ 场景：本地玩家按 W 键前进，服务端权威 + 客户端预测 ━━━━━" },
      { from: "autonomous", to: "autonomous", y: 162, kind: "internal", label: "T=0ms: 玩家按 W → 生成 FSavedMove (含时间戳/输入)" },
      { from: "autonomous", to: "autonomous", y: 252, kind: "internal", label: "PerformMovement(dt) → 立即在本地移动 Pawn（预测）" },
      { from: "autonomous", to: "autonomous", y: 342, kind: "internal", label: "ReplicateMoveToServer (打包 SavedMove → RPC)" },
      { from: "autonomous", to: "authority", y: 432, kind: "rpc", label: "ServerMove(TimeStamp, Accel, ClientLoc, MoveFlags) [~50ms]" },
      { from: "authority", to: "authority", y: 512, kind: "internal", label: "服务端: MoveAutonomous(TimeStamp, dt, Accel) [权威模拟]" },
      { from: "authority", to: "authority", y: 592, kind: "internal", label: "ServerCheckClientError (对比 ClientLoc vs ServerLoc)" },
      { from: "authority", to: "simulated", y: 682, kind: "note", label: "✅ 分支 A: 客户端预测正确 → 什么都不做 (99% 情况)" },
      { from: "authority", to: "simulated", y: 772, kind: "note", label: "⚠️ 分支 B: 位置误差大 → 服务器发送修正" },
      { from: "authority", to: "autonomous", y: 852, kind: "rpc", label: "🔴 ClientAdjustPosition(TimeStamp, NewLoc, NewVel, ...) [Reliable]" },
      { from: "autonomous", to: "autonomous", y: 942, kind: "internal", label: "客户端: 回滚位置 + 从 SavedMoves 中重放 T 之后的所有输入" },
      { from: "authority", to: "simulated", y: 1042, kind: "rpc", label: "📦 属性同步: ReplicatedMovement (Location + Velocity + Rotation)" },
      { from: "simulated", to: "simulated", y: 1122, kind: "internal", label: "SmoothClientPosition (向新位置插值 → 视觉平滑)" },
      { from: "authority", to: "simulated", y: 1222, kind: "note", label: "📝 三端网络时序小结：Client-side Prediction + Server Reconciliation" }
    ]
  }

};
