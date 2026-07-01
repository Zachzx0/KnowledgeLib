/**
 * 知识库图表数据 - 从 UE_Networking_Visualization.html 提取
 * 包含 9 个视图的完整图表数据 + 节点点击详情
 */
window.VIBE_CHARTS = {

  // === 1. 三种同步方案总览 ===
  "chart-ue-net-overview-001": {
    type: "graph",
    title: "UE 网络同步方案对比",
    nodes: [
      { id: "game", x: 600, y: 60, w: 220, h: 44, label: "游戏逻辑 (AActor / UActorComponent)", color: "#4a68b3",
        detail: { h: "游戏侧入口", src: "Runtime/Engine/Classes/GameFramework/Actor.h", desc: "开发者接触的两个入口: <code>UPROPERTY(Replicated)</code> 触发属性同步 · <code>UFUNCTION(Server/Client/NetMulticast)</code> 触发 RPC。三种同步方案对上层 API 是<b>透明的</b>——你的游戏代码几乎不用改。" } },
      { id: "native", x: 200, y: 200, w: 220, h: 60, label: "① 原生 Replication\n(UNetDriver + ActorChannel)", color: "#c47f3d",
        detail: { h: "UE 原生同步（默认）", src: "Runtime/Engine/Private/NetDriver.cpp\nRuntime/Engine/Private/ActorChannel.cpp", desc: "从 UE3 沿用至今。核心是 <code>UNetDriver::ServerReplicateActors</code> 每帧遍历所有 Actor × 所有 Connection，通过 <code>UActorChannel::ReplicateActor</code> 逐个属性 diff 后发出 <code>FOutBunch</code>。<br><br>优点：简单、稳定。<br>缺点：<b>O(N × M)</b> 复杂度，Actor 多、玩家多时 CPU 爆炸。" } },
      { id: "repgraph", x: 600, y: 200, w: 220, h: 60, label: "② ReplicationGraph\n(空间/兴趣分片)", color: "#4d8f9c",
        detail: { h: "ReplicationGraph（Fortnite 落地方案）", src: "Plugins/Runtime/ReplicationGraph/Source/Public/ReplicationGraph.h", desc: "实现了 <code>UReplicationDriver</code> 接口，接管原生的 <code>ServerReplicateActors</code>。将 Actor 按<b>空间格子/休眠/永久相关</b>等策略预分类到 Graph Node 中。<br><br>Fortnite 100 玩家大逃杀就是靠它扛下来的。<br>优点：CPU 从 O(N×M) 降到接近 O(k×M)。<br>缺点：需要为每个游戏定制 Graph 拓扑。" } },
      { id: "iris", x: 1000, y: 200, w: 220, h: 60, label: "③ Iris ReplicationSystem\n(UE5 新一代 Experimental)", color: "#8b5db8",
        detail: { h: "Iris (UE5 新一代同步框架)", src: "Runtime/Experimental/Iris/Core/Public/Iris/ReplicationSystem/ReplicationSystem.h", desc: "Epic 从头重写的现代同步系统。用<b>数据驱动</b>的 <code>FReplicationStateDescriptor</code> 描述属性布局，用 <code>ChangeMask</code> 位图追踪脏数据。<br><br>核心接口：<code>PreSendUpdate</code> → <code>SendUpdate</code> → <code>PostSendUpdate</code>。<br>优点：更快的序列化、Push Model、多线程友好。<br>缺点：截至 UE 5.4 仍标记 Experimental。" } },
      { id: "n_netdriver", x: 60, y: 340, w: 170, h: 38, label: "UNetDriver", color: "#c47f3d",
        detail: { h: "UNetDriver", src: "Runtime/Engine/Classes/Engine/NetDriver.h", desc: "网络驱动。<code>ServerReplicateActors</code> 每 Tick 主循环 · 管理 <code>ClientConnections</code> · 派发 <code>ProcessRemoteFunction</code> 到目标 Channel。" } },
      { id: "n_conn", x: 60, y: 400, w: 170, h: 38, label: "UNetConnection", color: "#c47f3d",
        detail: { h: "UNetConnection", src: "Runtime/Engine/Classes/Engine/NetConnection.h", desc: "代表一个客户端连接。持有 <code>UActorChannel</code> 数组、Bunch 打包缓冲、可靠性 ACK 记录、Tick 时把 Bunch 组装成 <code>FPacket</code> 交给 <code>ISocketSubsystem</code>。" } },
      { id: "n_channel", x: 60, y: 460, w: 170, h: 38, label: "UActorChannel", color: "#c47f3d",
        detail: { h: "UActorChannel", src: "Runtime/Engine/Classes/Engine/ActorChannel.h", desc: "一个 Actor 一个 Channel。<code>ReplicateActor()</code> 用 <code>FRepLayout</code> diff 出脏字段, 写入 <code>FOutBunch</code>, 交给 <code>SendBunch</code>。" } },
      { id: "n_replayout", x: 60, y: 520, w: 170, h: 38, label: "FRepLayout", color: "#2fa66b",
        detail: { h: "FRepLayout", src: "Runtime/Engine/Private/Net/RepLayout.cpp", desc: "反射生成的属性布局缓存。负责 diff（<code>DiffProperties</code>）、序列化（<code>SendProperties/SendPropertiesForRPC</code>）与反序列化。RPC 参数、UPROPERTY 都走它。" } },
      { id: "rg_graph", x: 490, y: 340, w: 170, h: 38, label: "UReplicationGraph", color: "#4d8f9c",
        detail: { h: "UReplicationGraph", src: "Plugins/Runtime/ReplicationGraph/Source/Public/ReplicationGraph.h", desc: "继承 <code>UReplicationDriver</code>。持有若干 <code>UReplicationGraphNode</code>（Grid、Dormancy、AlwaysRelevant 等），重写 <code>ServerReplicateActors</code>。" } },
      { id: "rg_node", x: 490, y: 400, w: 170, h: 38, label: "UReplicationGraphNode", color: "#4d8f9c",
        detail: { h: "UReplicationGraphNode（基类）", src: "Plugins/Runtime/ReplicationGraph/Source/Public/ReplicationGraph.h", desc: "Graph 节点抽象。子类：<br>• <code>Node_GridSpatialization2D</code>：空间格子<br>• <code>Node_DormancyNode</code>：休眠 Actor 分组<br>• <code>Node_AlwaysRelevant_ForConnection</code>：永远相关<br>• <code>Node_ActorList</code>：普通列表<br>• <code>Node_DynamicSpatialFrequency</code>：动态频率" } },
      { id: "rg_gather", x: 490, y: 460, w: 170, h: 38, label: "GatherActorListsForConnection", color: "#4d8f9c",
        detail: { h: "GatherActorListsForConnection", src: "Plugins/Runtime/ReplicationGraph/Source/Public/ReplicationGraph.h", desc: "每个 Node 的核心接口。根据传入的 <code>FConnectionGatherActorListParameters</code>（含 Viewer 位置/半径/连接信息）向 OutList 追加相关 Actor。这是分片的<b>关键剪枝点</b>。" } },
      { id: "rg_channel", x: 490, y: 520, w: 170, h: 38, label: "（复用）UActorChannel + FRepLayout", color: "#c47f3d",
        detail: { h: "底层复用", src: "", desc: "ReplicationGraph 只替换了<b>选谁同步</b>的策略，<b>怎么序列化和发包</b>仍然复用原生的 UActorChannel/FRepLayout/FOutBunch/UNetConnection 全套底层。" } },
      { id: "i_system", x: 920, y: 340, w: 170, h: 38, label: "UReplicationSystem", color: "#8b5db8",
        detail: { h: "UReplicationSystem", src: "Runtime/Experimental/Iris/Core/Public/Iris/ReplicationSystem/ReplicationSystem.h", desc: "Iris 顶层。核心接口 <code>PreSendUpdate(DeltaSeconds)</code> 做 poll/filter/priority；<code>SendUpdate(SendFn)</code> 把字节流写入网络层；<code>PostSendUpdate()</code> 清脏。<code>MarkDirty(Handle)</code> 是 Push Model 入口。" } },
      { id: "i_bridge", x: 920, y: 400, w: 170, h: 38, label: "UObjectReplicationBridge", color: "#8b5db8",
        detail: { h: "UObjectReplicationBridge", src: "Runtime/Experimental/Iris/Core/Public/Iris/ReplicationSystem/ObjectReplicationBridge.h", desc: "把 UObject 世界（Actor/Component）映射到 Iris 的 <code>FNetRefHandle</code>。<code>BeginReplication(UObject*)</code> 是注册入口。相当于原生 UActorChannel 的对等物，但更抽象——可以桥接任意 UObject。" } },
      { id: "i_desc", x: 920, y: 460, w: 170, h: 38, label: "FReplicationStateDescriptor", color: "#2fa66b",
        detail: { h: "FReplicationStateDescriptor", src: "Runtime/Experimental/Iris/Core/Public/Iris/ReplicationState/ReplicationStateDescriptor.h", desc: "<b>Iris 的核心创新</b>。在类初始化时通过 <code>ReplicationStateDescriptorBuilder</code> 一次性生成属性布局描述符（含 offset/size/NetSerializer/ChangeMask 位）。之后所有 diff / 序列化都是 O(1) 查表，不再运行时反射。" } },
      { id: "i_writer", x: 920, y: 520, w: 170, h: 38, label: "ReplicationWriter / Reader", color: "#a44",
        detail: { h: "ReplicationWriter / ReplicationReader", src: "Runtime/Experimental/Iris/Core/Private/Iris/ReplicationSystem/ReplicationWriter.cpp", desc: "Iris 独立于 ActorChannel 的收发通道。基于 Bit Stream 直接写 <code>FNetBitStreamWriter</code>，绕开 UActorChannel/FOutBunch，配合 DataStream 层做丢包重传。" } }
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
      { id: "user", x: 80, y: 80, w: 220, h: 50, label: "开发者代码\nUPROPERTY(Replicated) / RPC", color: "#4a68b3",
        detail: { h: "开发者接触面", src: "", desc: "两种方式：<br>1) <code>UPROPERTY(Replicated)</code> + <code>GetLifetimeReplicatedProps</code> 声明属性同步<br>2) <code>UFUNCTION(Server, Reliable/Unreliable)</code> 声明 RPC<br>UHT 会为每个 UClass 生成 rep-layout 元数据。" } },
      { id: "preplication", x: 80, y: 180, w: 220, h: 40, label: "AActor::PreReplication", color: "#c47f3d",
        detail: { h: "PreReplication 钩子", src: "Runtime/Engine/Private/Actor.cpp", desc: "每帧同步前调用，用于动态开关某些属性的同步（如 <code>DOREPLIFETIME_ACTIVE_OVERRIDE</code>）。" } },
      { id: "sra", x: 80, y: 250, w: 220, h: 50, label: "UNetDriver::\nServerReplicateActors", color: "#c47f3d",
        detail: { h: "ServerReplicateActors 主循环", src: "Runtime/Engine/Private/NetDriver.cpp:1520", desc: "服务端每帧调用一次。子步骤：<br>• <code>_PrepConnections</code> 更新每个连接的 Viewer<br>• <code>_BuildConsiderList</code> 收集活跃 Actor<br>• <code>_PrioritizeActors</code>（NetPriority × 距离衰减）<br>• <code>_ProcessPrioritizedActorsRange</code> 逐个复制" } },
      { id: "consider", x: 80, y: 330, w: 220, h: 40, label: "BuildConsiderList\n(所有活跃 Actor)", color: "#c47f3d",
        detail: { h: "ConsiderList 构建", src: "Runtime/Engine/Private/NetDriver.cpp:2009", desc: "从 <code>NetworkObjects</code> 中筛出：不 Dormant 且 <code>NextUpdateTime</code> 到期的 Actor。这份列表被<b>所有 Connection 共享</b>——但每个连接还要各自算 IsRelevant，这就是 O(N×M) 的来源。" } },
      { id: "priorit", x: 80, y: 400, w: 220, h: 40, label: "PrioritizeActors\n(NetPriority × 距离)", color: "#c47f3d",
        detail: { h: "PrioritizeActors", src: "Runtime/Engine/Private/NetDriver.cpp:2012", desc: "为每个 Connection 计算优先级：<code>Actor->NetPriority × (1 / DistanceSq) × TimeSinceLastUpdate</code>。带宽有限时按此排序，只发前 K 个。" } },
      { id: "chan", x: 400, y: 250, w: 220, h: 50, label: "UActorChannel::\nReplicateActor()", color: "#c47f3d",
        detail: { h: "ReplicateActor", src: "Runtime/Engine/Classes/Engine/ActorChannel.h:194", desc: "一个 Actor 一次同步的核心。步骤：<br>1. 首次同步 → 序列化 Actor 类信息<br>2. 遍历 Actor + 所有 SubObject<br>3. 对每个 Object 调 <code>FObjectReplicator::ReplicateProperties</code><br>4. 用 <code>FRepLayout</code> diff 出改动位<br>5. <code>WriteContentBlockPayload</code> 写入 Bunch<br>6. <code>SendBunch</code>" } },
      { id: "objrepl", x: 400, y: 340, w: 220, h: 40, label: "FObjectReplicator::\nReplicateProperties", color: "#2fa66b",
        detail: { h: "FObjectReplicator", src: "Runtime/Engine/Private/DataReplication.cpp", desc: "每个被同步的 UObject（Actor/Component/SubObject）配一个 Replicator，缓存上次发送的 <b>Shadow State</b>。diff 时对比当前值与 Shadow 生成 changed handles。" } },
      { id: "replayout", x: 400, y: 420, w: 220, h: 50, label: "FRepLayout\n(反射生成的字段布局)", color: "#2fa66b",
        detail: { h: "FRepLayout", src: "Runtime/Engine/Private/Net/RepLayout.cpp", desc: "类初始化时通过反射扫 <code>UPROPERTY(Replicated)</code> 生成 <code>FRepLayoutCmd</code> 序列。<br><br>核心方法：<br>• <code>DiffProperties</code>：对比新旧值<br>• <code>SendProperties</code>：写 Bit Stream<br>• <code>ReceiveProperties</code>：读并反序列化<br>• <code>SendPropertiesForRPC</code>：RPC 参数序列化" } },
      { id: "bunch", x: 720, y: 250, w: 220, h: 50, label: "FOutBunch\n(通道级消息包)", color: "#2fa66b",
        detail: { h: "FOutBunch", src: "Runtime/Engine/Classes/Engine/NetConnection.h", desc: "一个 Bunch = 一次逻辑消息（一次属性更新 / 一个 RPC）。带 header：ChannelIndex/bReliable/bOpen/bClose/PacketID。多个 Bunch 会被 <code>UNetConnection::PrepareWriteBitsToSendBuffer</code> 打包成一个 UDP Packet。" } },
      { id: "sendbunch", x: 720, y: 340, w: 220, h: 50, label: "UChannel::SendBunch", color: "#a44",
        detail: { h: "SendBunch", src: "Runtime/Engine/Classes/Engine/Channel.h:145", desc: "把 Bunch 塞进 <code>UNetConnection</code> 的 SendBuffer。<b>关键机制</b>：<br>• 可靠 Bunch 存入 <code>OutRec</code> 链表，直到 ACK 才释放<br>• 大 Bunch 会被自动拆成 <code>PartialBunch</code><br>• <code>bMerge=true</code> 允许与前一个 Bunch 合并省 header" } },
      { id: "flushnet", x: 720, y: 430, w: 220, h: 50, label: "UNetConnection::FlushNet\n(打包 UDP Packet)", color: "#a44",
        detail: { h: "FlushNet", src: "Runtime/Engine/Private/NetConnection.cpp", desc: "把 SendBuffer 中所有 Bit 流封装成 <code>FPacket</code>：加 PacketHeader（PacketId + AckBits）+ 序列号 + 校验尾。最终调 <code>ISocketSubsystem::SendTo</code> 走 UDP 发出。<br><br>注意：ACK 是<b>捎带</b>在下一个 Packet 头里的，不是独立包。" } },
      { id: "recv", x: 400, y: 530, w: 220, h: 50, label: "UNetConnection::ReceivedPacket", color: "#a44",
        detail: { h: "客户端收包", src: "Runtime/Engine/Private/NetConnection.cpp", desc: "客户端 Tick → <code>UIpNetDriver::TickDispatch</code> → <code>ReceivedRawPacket</code> → 解包 header → 拆出 Bunch → 按 ChannelIndex 派发到对应 <code>UActorChannel::ReceivedBunch</code>。" } },
      { id: "processbunch", x: 80, y: 530, w: 220, h: 50, label: "UActorChannel::ProcessBunch", color: "#c47f3d",
        detail: { h: "ProcessBunch", src: "Runtime/Engine/Classes/Engine/ActorChannel.h:178", desc: "客户端解 Bunch：<br>• 首次 → <code>ReadContentBlockPayload</code> 生成 Actor<br>• 后续 → <code>FRepLayout::ReceiveProperties</code> 反序列化并<b>直接写内存</b><br>• 触发 <code>OnRep_XXX</code> 回调<br>• RPC → 查函数表并 <code>ProcessEvent</code>" } }
    ],
    edges: [
      { from: "user", to: "preplication" }, { from: "preplication", to: "sra" }, { from: "sra", to: "consider" }, { from: "consider", to: "priorit" },
      { from: "priorit", to: "chan" }, { from: "chan", to: "objrepl" }, { from: "objrepl", to: "replayout" },
      { from: "replayout", to: "bunch" }, { from: "bunch", to: "sendbunch" }, { from: "sendbunch", to: "flushnet" },
      { from: "flushnet", to: "recv" }, { from: "recv", to: "processbunch" }
    ]
  },

  // === 3. ReplicationGraph 空间分片架构 ===
  "chart-ue-repgraph-003": {
    type: "graph",
    title: "② ReplicationGraph · 空间分片架构",
    nodes: [
      { id: "init", x: 80, y: 80, w: 260, h: 50, label: "UReplicationGraph::InitGlobalGraphNodes\n(启动时构建 Graph 拓扑)", color: "#4d8f9c",
        detail: { h: "启动时构建 Graph", src: "Plugins/Runtime/ReplicationGraph/Source/Public/ReplicationGraph.h:36", desc: "游戏启动时（<code>InitializeForWorld</code>）构建 Graph 拓扑：创建 GridSpatialization、AlwaysRelevant、Dormancy 等 Node，并通过 <code>AddGlobalGraphNode</code> 挂到根。<br><br>不同游戏定制自己的 Graph 拓扑（Fortnite 有专门的 <code>UFortReplicationGraph</code>）。" } },
      { id: "add", x: 80, y: 170, w: 260, h: 50, label: "RouteAddNetworkActorToNodes\n(Actor 注册到 Node)", color: "#4d8f9c",
        detail: { h: "Actor 分类", src: "Plugins/Runtime/ReplicationGraph/Source/Public/ReplicationGraph.h:39", desc: "新 Actor SpawnActor 时，Graph 根据 <code>FClassReplicationInfo</code>（每个类的策略）路由到相应 Node：<br>• 静态背景物 → <code>Node_GridSpatialization2D</code><br>• 玩家 PC → <code>Node_AlwaysRelevant_ForConnection</code><br>• 场景管理 → <code>Node_ActorList</code><br>• 长时间不动 → <code>Node_DormancyNode</code>" } },
      { id: "grid", x: 400, y: 130, w: 260, h: 60, label: "Node_GridSpatialization2D\n(把地图切成 N×N 格)", color: "#4d8f9c",
        detail: { h: "空间网格分片", src: "Plugins/Runtime/ReplicationGraph/Source/Public/ReplicationGraph.h", desc: "<b>Fortnite 大逃杀的关键节点</b>。把整个 World 切成固定大小的 2D 格子（如 10000×10000），每个 Actor 按位置塞入对应格。<br><br>Gather 时只查 Viewer 周围 3×3 格 → 复杂度从 O(N) 降到 O(常数)。" } },
      { id: "dorm", x: 400, y: 220, w: 260, h: 60, label: "Node_DormancyNode\n(休眠 Actor 只在唤醒时同步)", color: "#4d8f9c",
        detail: { h: "休眠管理", src: "Plugins/Runtime/ReplicationGraph/Source/Public/ReplicationGraph.h:483", desc: "处于 <code>DORM_Initial</code> / <code>DORM_DormantAll</code> 的 Actor 停止 poll。有属性变动时游戏代码调 <code>FlushNetDormancy</code> 唤醒。<br><br>大量静态物件（房屋、装饰）默认 dormant，几乎不占 CPU。" } },
      { id: "always", x: 400, y: 310, w: 260, h: 60, label: "Node_AlwaysRelevant_ForConnection\n(每个连接自己的 PC/Pawn)", color: "#4d8f9c",
        detail: { h: "永远相关", src: "Plugins/Runtime/ReplicationGraph/Source/Public/ReplicationGraph.h", desc: "每个 Connection 有<b>独立</b>的一份此 Node。存放：<br>• 该玩家的 PlayerController<br>• 该玩家的 Pawn<br>• 该玩家的 PlayerState<br>无需空间检测，永远列入同步列表。" } },
      { id: "freq", x: 400, y: 400, w: 260, h: 60, label: "Node_DynamicSpatialFrequency\n(远处降频)", color: "#4d8f9c",
        detail: { h: "动态频率", src: "Plugins/Runtime/ReplicationGraph/Source/Public/ReplicationGraph.h:320", desc: "根据 Actor 到 Viewer 的距离动态调整 <code>NetUpdateFrequency</code>：<br>• 近处 → 30Hz<br>• 中距 → 10Hz<br>• 远处 → 1Hz<br>类似 LOD。" } },
      { id: "sra", x: 720, y: 130, w: 260, h: 60, label: "UReplicationGraph::ServerReplicateActors\n(重写主循环)", color: "#4d8f9c",
        detail: { h: "替代原生主循环", src: "Plugins/Runtime/ReplicationGraph/Source/Public/BasicReplicationGraph.h:57", desc: "继承自 <code>UReplicationDriver</code>，被 UNetDriver 通过 SetReplicationDriver 挂上。整个 Tick 流程：<br>1. Prepare（更新每个 Node）<br>2. 遍历每个 Connection<br>3. 对每 Connection 调各 Node 的 <code>GatherActorListsForConnection</code>（关键剪枝）<br>4. 合并结果 → 走原生 UActorChannel 发送" } },
      { id: "gather", x: 720, y: 230, w: 260, h: 60, label: "GatherActorListsForConnection\n(关键剪枝点)", color: "#4d8f9c",
        detail: { h: "GatherActorListsForConnection", src: "Plugins/Runtime/ReplicationGraph/Source/Public/ReplicationGraph.h:96", desc: "每个 Node 各自实现。传入 <code>FConnectionGatherActorListParameters</code>（Viewer 位置/连接ID/输出列表引用）。<br><br>示例：GridSpatialization2D 只把 Viewer 周围 3×3 格 Actor 塞入 OutList；DormancyNode 只输出被唤醒的；AlwaysRelevant 无脑输出。" } },
      { id: "send", x: 720, y: 330, w: 260, h: 60, label: "（复用）UActorChannel + FRepLayout\n实际序列化和发包", color: "#c47f3d",
        detail: { h: "底层复用原生", src: "", desc: "⚠️ RepGraph <b>只是替换了\"选谁\"的策略</b>。Gather 出来的候选列表最终仍然：<br>• 每个 Actor → 找/创建 <code>UActorChannel</code><br>• → <code>ReplicateActor()</code><br>• → <code>FRepLayout::SendProperties</code><br>• → <code>SendBunch</code><br>和原生同步共用一套发包底层。" } },
      { id: "gain", x: 720, y: 430, w: 260, h: 80, label: "✨ 性能收益\nO(N×M) → 近似 O(k×M)", color: "#5b7bd8",
        detail: { h: "为什么 RepGraph 快", src: "", desc: "原生：每帧 <code>N 个 Actor × M 个 Connection</code> 的 IsRelevant 检查<br>RepGraph：每 Connection 只从少数 Node 拿相关列表，k 远小于 N。<br><br>Fortnite 100 玩家场景（N ≈ 20000, M = 100），CPU 从\"服务器炸\"降到可接受。" } }
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
      { id: "reg", x: 80, y: 80, w: 280, h: 50, label: "UObjectReplicationBridge::BeginReplication\n注册 UObject → FNetRefHandle", color: "#8b5db8",
        detail: { h: "BeginReplication", src: "Runtime/Experimental/Iris/Core/Public/Iris/ReplicationSystem/ObjectReplicationBridge.h:111", desc: "游戏侧调 Bridge->BeginReplication 注册要同步的 UObject（Actor / Component）。返回 <code>FNetRefHandle</code>——Iris 内部的轻量句柄，替代 UActorChannel。" } },
      { id: "desc", x: 80, y: 180, w: 280, h: 60, label: "FReplicationStateDescriptorBuilder\n(编译期生成属性布局)", color: "#2fa66b",
        detail: { h: "ReplicationStateDescriptor", src: "Runtime/Experimental/Iris/Core/Private/Iris/ReplicationState/ReplicationStateDescriptorBuilder.cpp", desc: "<b>Iris 的核心创新</b>。类初始化时一次性从反射构建 <code>FReplicationStateDescriptor</code>：<br>• 字段 offset / size<br>• 每字段的 <code>FNetSerializer</code> 指针<br>• ChangeMask 位号<br>• Push Model 支持标记<br>后续所有 diff/序列化都是 O(1) 查表, <b>不再运行时反射</b>。" } },
      { id: "mark", x: 80, y: 290, w: 280, h: 60, label: "MarkDirty(Handle) + ChangeMask\n(Push Model 增量位图)", color: "#8b5db8",
        detail: { h: "ChangeMask 增量位图", src: "Runtime/Experimental/Iris/Core/Private/Iris/ReplicationSystem/ChangeMaskUtil.h", desc: "每个被同步的对象持有一份 <b>ChangeMask（位图）</b>。属性 setter 或 <code>MARK_PROPERTY_DIRTY</code> 宏把对应 bit 置 1。<br><br>PreSendUpdate 时只需扫 ChangeMask ≠ 0 的对象和位——比原生的\"逐字段 diff Shadow State\"快得多。" } },
      { id: "presend", x: 400, y: 80, w: 260, h: 60, label: "ReplicationSystem::PreSendUpdate(Δ)\n(过滤 + 优先级 + Poll)", color: "#8b5db8",
        detail: { h: "PreSendUpdate", src: "Runtime/Experimental/Iris/Core/Public/Iris/ReplicationSystem/ReplicationSystem.h:101", desc: "每帧核心入口。子步骤：<br>• <b>Poll</b>: 采样非 Push Model 属性到 State Buffer<br>• <b>Filter</b>: <code>NetObjectFilter</code>（空间/兴趣/连接白名单）<br>• <b>Prioritize</b>: <code>NetObjectPrioritizer</code><br>• 生成本帧要发的对象集合" } },
      { id: "filter", x: 400, y: 190, w: 260, h: 60, label: "NetObjectFilter\n(可插拔过滤器)", color: "#8b5db8",
        detail: { h: "NetObjectFilter", src: "Runtime/Experimental/Iris/Core/Public/Iris/ReplicationSystem/Filtering/NetObjectFilter.h", desc: "类似 RepGraph Node 的现代版。可实现自定义 Filter，比如：<br>• 空间距离 Filter<br>• 队伍/仇恨 Filter<br>• 视锥 Filter<br>返回一个位图指定哪些对象对哪些 Connection 可见。" } },
      { id: "prio", x: 400, y: 300, w: 260, h: 60, label: "NetObjectPrioritizer\n(带宽紧张时的排序)", color: "#8b5db8",
        detail: { h: "NetObjectPrioritizer", src: "Runtime/Experimental/Iris/Core/Public/Iris/ReplicationSystem/Prioritization/NetObjectPrioritizer.h", desc: "每 Connection 每帧对候选对象打分。类似原生 NetPriority，但更灵活：可自定义 SpaceUsage / DistanceSq / RecentActivity 组合。带宽满时截断。" } },
      { id: "writer", x: 720, y: 80, w: 260, h: 60, label: "ReplicationWriter\n(写 Bit Stream)", color: "#a44",
        detail: { h: "ReplicationWriter", src: "Runtime/Experimental/Iris/Core/Private/Iris/ReplicationSystem/ReplicationWriter.cpp", desc: "脱离 UActorChannel/FOutBunch。直接对每个 dirty state 用其 <code>FNetSerializer</code> 序列化到 <code>FNetBitStreamWriter</code>。<br><br>写入格式包含：Handle 索引 + ChangeMask 位段 + 数据。整体 packet 由 <code>DataStreamManager</code> 组装。" } },
      { id: "ds", x: 720, y: 190, w: 260, h: 60, label: "DataStreamManager\n(丢包 / 重传 / 优先级流)", color: "#a44",
        detail: { h: "DataStreamManager", src: "Runtime/Experimental/Iris/Core/Private/Iris/DataStream/DataStreamManager.cpp", desc: "Iris 独立的分层数据流管理。多路复用不同类型流：<br>• ReplicationDataStream（属性同步）<br>• AttachmentReplication（RPC）<br>• NetTokenDataStream（字符串/引用）<br>每个流独立可靠性/优先级。" } },
      { id: "send", x: 720, y: 300, w: 260, h: 60, label: "SendUpdate(SendFn)\n(实际交给下层网络)", color: "#8b5db8",
        detail: { h: "SendUpdate", src: "Runtime/Experimental/Iris/Core/Public/Iris/ReplicationSystem/ReplicationSystem.h:115", desc: "把 Writer 组装好的字节数组通过 <code>SendFunction</code> lambda 交给下层（当前仍走 UNetConnection 的 socket）。未来 Epic 计划让 Iris 完全接管网络层。" } },
      { id: "reader", x: 720, y: 410, w: 260, h: 60, label: "ReplicationReader (客户端)", color: "#a44",
        detail: { h: "ReplicationReader", src: "Runtime/Experimental/Iris/Core/Private/Iris/ReplicationSystem/ReplicationReader.cpp", desc: "客户端对称的读取端。用同一份 <code>FReplicationStateDescriptor</code> 反向查表，<code>DequantizeAndApplyHelper</code> 把量化后的字节流解码回 UObject 属性。触发 RepNotify 回调。" } },
      { id: "post", x: 400, y: 410, w: 260, h: 60, label: "PostSendUpdate\n(清 ChangeMask, 记录 ACK 依赖)", color: "#8b5db8",
        detail: { h: "PostSendUpdate", src: "Runtime/Experimental/Iris/Core/Public/Iris/ReplicationSystem/ReplicationSystem.h:120", desc: "发完清理：<br>• 已发出的 dirty bit 移入\"pending ACK\"记录<br>• ACK 到达 → 真正清 mask<br>• 丢包 → 重新标 dirty<br>基于 <code>PacketNotification</code> 系统。" } },
      { id: "gain", x: 80, y: 410, w: 280, h: 100, label: "✨ Iris 相对原生的优势", color: "#5b7bd8",
        detail: { h: "为何 Iris 更快", src: "", desc: "1. <b>无运行时反射</b>：Descriptor 编译期建好<br>2. <b>Push Model</b>：ChangeMask 位图 vs 原生 diff Shadow<br>3. <b>可插拔过滤/优先级</b>：类似 RepGraph 但更细粒度<br>4. <b>脱离 ActorChannel</b>：不再受 128 通道限制<br>5. <b>多线程友好</b>：Descriptor 只读、Poll/Filter 可并行<br>6. <b>更小的 Bit 数</b>：NetSerializer 支持 range/quantization" } }
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
      { id: "call", x: 60, y: 80, w: 260, h: 60, label: "游戏代码：\nActor->ServerXXX(params)", color: "#4a68b3",
        detail: { h: "RPC 调用点", src: "", desc: "<code>UFUNCTION(Server, Reliable, WithValidation)</code> 声明后，UHT 生成 <code>ServerXXX_Implementation</code>（真正逻辑）和 thunk（<code>ServerXXX_Validate</code>+走网络）。开发者调 <code>ServerXXX(...)</code> 实际进入 thunk。" } },
      { id: "callremote", x: 60, y: 180, w: 260, h: 50, label: "AActor::CallRemoteFunction", color: "#c47f3d",
        detail: { h: "CallRemoteFunction", src: "Runtime/Engine/Private/Actor.cpp:5242", desc: "thunk 调此方法。它枚举 <code>GetNetDriverList</code> 的所有 NetDriver（Game / Demo / Beacon），对每个调 <code>ProcessRemoteFunction</code>。" } },
      { id: "processremote", x: 60, y: 270, w: 260, h: 60, label: "UNetDriver::ProcessRemoteFunction", color: "#c47f3d",
        detail: { h: "ProcessRemoteFunction", src: "Runtime/Engine/Private/NetDriver.cpp:7418", desc: "派发核心。判定：<br>• Server RPC → 找 <code>ServerConnection</code><br>• Client RPC → Actor 的 OwningConnection<br>• Multicast → 广播到所有 Client Connection<br>然后调 <code>InternalProcessRemoteFunction</code>。" } },
      { id: "internal", x: 60, y: 370, w: 260, h: 60, label: "InternalProcessRemoteFunctionPrivate", color: "#c47f3d",
        detail: { h: "InternalProcessRemoteFunctionPrivate", src: "Runtime/Engine/Private/NetDriver.cpp:2461", desc: "找到目标 <code>UActorChannel</code>（如无则新建）→ 交给 <code>ProcessRemoteFunctionForChannelPrivate</code>。" } },
      { id: "chanprivate", x: 400, y: 80, w: 260, h: 70, label: "ProcessRemoteFunctionForChannelPrivate\n(RPC 打包核心)", color: "#c47f3d",
        detail: { h: "ProcessRemoteFunctionForChannelPrivate", src: "Runtime/Engine/Private/NetDriver.cpp:2593", desc: "关键步骤：<br>1. 若 Channel.OpenPacketId==INDEX_NONE → 先 <code>Ch->ReplicateActor()</code><br>2. 新建 <code>FOutBunch Bunch(Ch, 0)</code><br>3. 若 <code>FUNC_NetReliable</code> → <code>Bunch.bReliable=1</code><br>4. 序列化参数 → 写入 <code>FNetBitWriter TempWriter</code><br>5. 写 header + payload 到 Bunch<br>6. <code>Ch->SendBunch(&Bunch, true)</code>" } },
      { id: "replayoutrpc", x: 400, y: 190, w: 260, h: 60, label: "FRepLayout::SendPropertiesForRPC\n(参数序列化)", color: "#2fa66b",
        detail: { h: "SendPropertiesForRPC", src: "Runtime/Engine/Private/Net/RepLayout.cpp", desc: "和属性同步共用同一套 RepLayout。RPC 参数被当作一个\"临时结构体\"，逐字段调 <code>NetSerialize</code>。<br><br>特殊处理：Object 引用会转成 <code>FNetworkGUID</code>；引用不到时进 <code>Unmapped</code> 队列等 GUID 到达。" } },
      { id: "writeblock", x: 400, y: 290, w: 260, h: 70, label: "WriteFieldHeaderAndPayload\n+ WriteContentBlockPayload", color: "#2fa66b",
        detail: { h: "RPC Bunch 结构", src: "Runtime/Engine/Private/DataChannel.cpp", desc: "一个 RPC Bunch 里塞：<br>• ContentBlockHeader：目标 SubObject GUID / bStablyNamed<br>• FieldHeader：<code>FieldNetIndex</code>（RPC 在类中的编号）<br>• Payload：参数序列化后的 bit 流<br>组织成 <code>[BlockHeader | FieldHeader | Payload]</code>" } },
      { id: "queue", x: 400, y: 390, w: 260, h: 60, label: "⚡ Multicast Unreliable → \n先 QueueRemoteFunctionBunch", color: "#5b7bd8",
        detail: { h: "延迟发送优化", src: "Runtime/Engine/Private/NetDriver.cpp:2820", desc: "源码实证：<code>QueueBunch = ( !Bunch.bReliable && Function->FunctionFlags & FUNC_NetMulticast )</code>。<br><br>不可靠 Multicast 会先入队 <code>QueuedExportBunches</code>，等下一次 Actor 属性同步时一起发（省 header + 增加合批率）。" } },
      { id: "sendbunch", x: 730, y: 80, w: 260, h: 60, label: "UActorChannel::SendBunch\n(交给 UNetConnection)", color: "#a44",
        detail: { h: "SendBunch", src: "Runtime/Engine/Classes/Engine/Channel.h:145", desc: "塞入 <code>UNetConnection</code> SendBuffer。可靠 Bunch 保存到 <code>OutRec</code>，未 ACK 前会重发。" } },
      { id: "flush", x: 730, y: 180, w: 260, h: 60, label: "FlushNet → UDP Send", color: "#a44",
        detail: { h: "实际发包", src: "Runtime/Engine/Private/NetConnection.cpp", desc: "打包 PacketHeader + AckBits + Bunch 群 → <code>ISocketSubsystem::SendTo</code>。UE 的 UDP 包<b>永远是复合包</b>——一个 Packet 里可能塞属性同步 Bunch + 多个 RPC Bunch。" } },
      { id: "recvpacket", x: 730, y: 290, w: 260, h: 60, label: "客户端 UIpNetDriver::TickDispatch", color: "#a44",
        detail: { h: "客户端收包", src: "Runtime/Engine/Private/IpNetDriver.cpp", desc: "从 socket 读原始字节 → <code>UNetConnection::ReceivedRawPacket</code> → 解 PacketHeader（AckBits）→ 拆 Bunch。" } },
      { id: "recvbunch", x: 730, y: 390, w: 260, h: 60, label: "UActorChannel::ReceivedRawBunch\n→ ProcessBunch", color: "#c47f3d",
        detail: { h: "客户端解 RPC", src: "Runtime/Engine/Classes/Engine/ActorChannel.h:178", desc: "ProcessBunch 里读 BlockHeader → 找目标 SubObject → 读 FieldHeader → 通过 <code>ClassCache</code> 查到 UFunction → <code>FRepLayout::ReceivePropertiesForRPC</code> 反序列化参数 → <code>Object->ProcessEvent(Function, Parms)</code> 真正调用 <code>ServerXXX_Implementation</code>。" } },
      { id: "validate", x: 730, y: 490, w: 260, h: 60, label: "（Server RPC）\nServerXXX_Validate 校验", color: "#5b7bd8",
        detail: { h: "安全校验", src: "", desc: "带 <code>WithValidation</code> 的 Server RPC 会先跑 <code>ServerXXX_Validate</code> 校验参数合法性。返回 false → 服务器踢出该客户端（防作弊）。" } }
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
      { id: "decl", x: 60, y: 60, w: 260, h: 60, label: "类声明：\nUPROPERTY(ReplicatedUsing=OnRep_HP)\nfloat HP;", color: "#4a68b3",
        detail: { h: "属性声明", src: "", desc: "<code>UPROPERTY(Replicated)</code> 或带 RepNotify 的 <code>ReplicatedUsing=OnRep_XXX</code>。<br>还需在 <code>GetLifetimeReplicatedProps</code> 里注册：<code>DOREPLIFETIME(AMyActor, HP);</code><br>可加条件：<code>DOREPLIFETIME_CONDITION(..., COND_OwnerOnly)</code>" } },
      { id: "layout", x: 60, y: 170, w: 260, h: 60, label: "FRepLayout::InitFromClass\n(反射生成布局，一次性)", color: "#2fa66b",
        detail: { h: "FRepLayout 初始化", src: "Runtime/Engine/Private/Net/RepLayout.cpp", desc: "类首次被同步时构建，缓存永久。扫描所有 <code>UPROPERTY(Replicated)</code>：<br>• 生成 <code>FRepLayoutCmd</code>（含 offset/size/property/CmdType）<br>• 展开数组和嵌套结构<br>• 建立 handle 编号<br>之后每帧 diff 都用这份 Layout 表。" } },
      { id: "setter", x: 60, y: 280, w: 260, h: 60, label: "游戏运行时：\n服务器代码 HP -= 10", color: "#4a68b3",
        detail: { h: "属性变更", src: "", desc: "服务器代码直接改属性值。<b>只有服务器有权改</b>——客户端改了会被下一次同步覆盖。<br><br>Push Model 场景需要额外调 <code>MARK_PROPERTY_DIRTY_FROM_NAME</code> 通知系统。" } },
      { id: "sra", x: 400, y: 60, w: 280, h: 60, label: "UNetDriver::ServerReplicateActors\n(每 Tick, ServerTickTime 决定频率)", color: "#c47f3d",
        detail: { h: "主循环", src: "Runtime/Engine/Private/NetDriver.cpp:1520", desc: "服务器 <code>UWorld::Tick</code> → <code>UNetDriver::TickFlush</code> → <code>ServerReplicateActors</code>。默认约 30Hz（<code>NetServerMaxTickRate</code>）。" } },
      { id: "consider", x: 400, y: 170, w: 280, h: 60, label: "BuildConsiderList\n筛选 NextUpdateTime 到期的 Actor", color: "#c47f3d",
        detail: { h: "ConsiderList", src: "Runtime/Engine/Private/NetDriver.cpp:2009", desc: "不是所有 Actor 每帧都同步。每个 Actor 有自己的 <code>NetUpdateFrequency</code>（默认 100Hz），到期才进 ConsiderList。<br>Dormant 的 Actor 不进列表（除非 FlushNetDormancy 唤醒）。" } },
      { id: "per_conn", x: 400, y: 280, w: 280, h: 60, label: "For each UNetConnection:\n  IsRelevant + PrioritizeActors", color: "#c47f3d",
        detail: { h: "每连接过滤+排序", src: "Runtime/Engine/Private/NetDriver.cpp:2012", desc: "对每个连接：<br>1. 调 <code>Actor->IsNetRelevantFor(ViewerPawn, ViewerLoc)</code> 剔除不相关<br>2. 计算优先级 = <code>NetPriority × TimeSinceLast × 距离衰减</code><br>3. 按优先级排序<br>4. 按带宽预算截取前 K 个" } },
      { id: "chan", x: 730, y: 60, w: 280, h: 70, label: "UActorChannel::ReplicateActor\n(单 Actor 单次同步)", color: "#c47f3d",
        detail: { h: "ReplicateActor", src: "Runtime/Engine/Classes/Engine/ActorChannel.h:194", desc: "流程：<br>1. 首次 → 序列化 Actor 类 GUID + Location（生成通道）<br>2. 收集 Actor 及其所有 <code>ReplicatedSubObjects</code><br>3. 每个 UObject 一次 <code>FObjectReplicator::ReplicateProperties</code><br>4. 结果拼进一个 Bunch → SendBunch" } },
      { id: "diff", x: 730, y: 180, w: 280, h: 70, label: "FRepLayout::DiffProperties\n对比 Shadow State (上次值)", color: "#2fa66b",
        detail: { h: "脏字段检测", src: "Runtime/Engine/Private/Net/RepLayout.cpp", desc: "每个 UObject 的 <code>FObjectReplicator</code> 保存一份 <code>FRepShadowDataBuffer</code>——上次成功发送的所有属性值副本。<br><br>每帧 diff：逐 <code>FRepLayoutCmd</code> 比对当前值 vs Shadow → 生成 <code>ChangedPropertyTracker</code>。<br><br>⚠️ 这是原生方案<b>最贵的一步</b>——O(属性数)。Iris 的 Push Model 就是为消灭它。" } },
      { id: "send", x: 730, y: 300, w: 280, h: 60, label: "FRepLayout::SendProperties\n只写脏字段的 handle + 值", color: "#2fa66b",
        detail: { h: "写 Bit Stream", src: "Runtime/Engine/Private/Net/RepLayout.cpp", desc: "对每个 dirty handle 写：<br>• handle 编号（VarInt 压缩）<br>• 值（用属性对应的 <code>NetSerialize</code>）<br>Vector 会走 <code>SerializeCompressedVector</code>（16-bit 量化）；Rotator 走压缩到 8-bit。<br>末尾写 Terminator (0)。" } },
      { id: "bunch", x: 730, y: 410, w: 280, h: 60, label: "FOutBunch → SendBunch → Packet", color: "#a44",
        detail: { h: "发包", src: "", desc: "所有 dirty 属性 + SubObject 的 Bunch 拼成一个 <code>FOutBunch</code>。<br>大 Bunch 会自动切成 <code>PartialBunch</code>（bPartial=1）。<br>可靠 Bunch 存 OutRec 等 ACK, 丢包重发。" } },
      { id: "clientrecv", x: 400, y: 410, w: 280, h: 60, label: "客户端 ProcessBunch → \nFRepLayout::ReceiveProperties", color: "#c47f3d",
        detail: { h: "客户端反序列化", src: "Runtime/Engine/Classes/Engine/ActorChannel.h:178", desc: "读 handle 循环：<br>• 读 handle 编号（0=终止）<br>• 用同一份 <code>FRepLayoutCmd</code> 找到属性 offset<br>• <code>NetSerialize</code> 反序列化<br>• <b>直接写目标 UObject 内存</b>" } },
      { id: "onrep", x: 60, y: 410, w: 280, h: 60, label: "触发 OnRep_XXX 回调", color: "#5b7bd8",
        detail: { h: "RepNotify", src: "", desc: "客户端属性写入后，若声明了 <code>ReplicatedUsing=OnRep_HP</code>，会调 <code>OnRep_HP()</code>。<br><br>⚠️ 一个坑：即使值和之前一样也会触发（除非用 <code>REPNOTIFY_OnChanged</code>）；OnRep 参数可拿到旧值。" } },
      { id: "note1", x: 60, y: 520, w: 600, h: 70, label: "💡 关键优化：Shadow State + Handle 编号\n没变的属性完全不写字节；变了也只写 handle 而非属性名", color: "#5b7bd8",
        detail: { h: "为什么这样设计", src: "", desc: "早期 UE3 用属性名 hash 作为 tag——很浪费带宽。UE4/5 引入 handle 编号（同一 UClass 服务器和客户端 Layout 一致，编号相同）→ 每字段只花 1-2 字节 handle + 值。<br><br>Iris 更进一步：<b>连 handle 都不写</b>，直接靠 ChangeMask 位号定位。" } }
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
      { from: "authority", to: "authority", y: 100, kind: "internal", label: "Gameplay 逻辑改属性: HP -= 10",
        detail: { h: "服务端属性变更", src: "", desc: "⚠️ <b>只有 Authority 端能改带 Replicated 标签的属性</b>。客户端改了下一次同步会被覆盖。<br><br>Push Model 项目下服务端还需调 <code>MARK_PROPERTY_DIRTY_FROM_NAME(Actor, HP, this)</code>。" } },
      { from: "authority", to: "authority", y: 150, kind: "internal", label: "UWorld::Tick → UNetDriver::TickFlush",
        detail: { h: "服务端 Tick", src: "Runtime/Engine/Private/NetDriver.cpp", desc: "服务器每帧调 <code>TickFlush</code> 触发 <code>ServerReplicateActors</code>。默认 30Hz（<code>NetServerMaxTickRate</code>）——不是每帧属性都同步。" } },
      { from: "authority", to: "authority", y: 200, kind: "internal", label: "ServerReplicateActors → BuildConsiderList → PrioritizeActors",
        detail: { h: "挑选要同步的 Actor", src: "Runtime/Engine/Private/NetDriver.cpp:1520", desc: "ConsiderList 在<b>所有 Connection 之间共享一次</b>；然后按连接分别做 IsRelevant + Priority。这里 Authority 会为每个 Connection 各产出一份\"待发列表\"。" } },
      { from: "authority", to: "authority", y: 250, kind: "internal", label: "FRepLayout::DiffProperties (对比 Shadow State)",
        detail: { h: "Diff 脏字段", src: "Runtime/Engine/Private/Net/RepLayout.cpp", desc: "每个 Connection 的每个 Actor 一次 diff。<b>三端属性同步的分歧就在这里产生</b>：<br>• 对 AutonomousProxy 连接 → 会算上 <code>COND_OwnerOnly</code> / <code>COND_SimulatedOnly</code> 的 flag<br>• 对 SimulatedProxy 连接 → COND_OwnerOnly 属性会被过滤掉" } },
      { from: "authority", to: "autonomous", y: 330, kind: "rpc", label: "📦 Bunch 属性同步 (含 COND_OwnerOnly)",
        detail: { h: "发给主控客户端", src: "", desc: "FOutBunch 里含所有 dirty handle + 值。<br>对本 Actor 而言, AutonomousProxy 的连接会拿到<b>更多字段</b>——<code>COND_OwnerOnly</code>、<code>COND_ReplayOrOwner</code> 的属性只发给它。<br><br>⚡ 对角色移动而言，Authority → AutonomousProxy 主要发的是\"位置修正\"。" } },
      { from: "autonomous", to: "autonomous", y: 400, kind: "internal", label: "ProcessBunch → ReceiveProperties (直接写内存) → OnRep_XXX",
        detail: { h: "主控客户端应用属性", src: "Runtime/Engine/Classes/Engine/ActorChannel.h:178", desc: "客户端反序列化并<b>直接改本地对象内存</b>。触发 <code>OnRep_HP()</code>——但 HP 可能已被之前的<b>预测</b>更新过，OnRep 常用来做<b>视觉上的确认/rollback</b>。" } },
      { from: "authority", to: "simulated", y: 470, kind: "rpc", label: "📦 Bunch 属性同步 (剔除 OwnerOnly)",
        detail: { h: "发给旁观客户端", src: "", desc: "同一时刻 (但不同 Bunch)，Authority 也把该 Actor 同步给场景里其他玩家。<b>关键差异</b>：<br>• 不发 COND_OwnerOnly 属性 (敏感数据如金币/装备详情)<br>• 位置 / 血量 / 状态位一定发<br>• 频率通常更低 (远处 Actor 的 NetUpdateFrequency 会衰减)" } },
      { from: "simulated", to: "simulated", y: 540, kind: "internal", label: "ProcessBunch → 应用属性 → 触发插值 (SmoothCorrection)",
        detail: { h: "旁观客户端应用属性", src: "Runtime/Engine/Private/Components/CharacterMovementComponent.cpp", desc: "⚡ SimulatedProxy 上收到位置更新后<b>不会瞬移</b>——它把新位置存为<b>目标</b>，然后每帧插值过去（<code>SmoothClientPosition</code>）——这就是为什么\"别人\"看起来动作平滑。<br><br>没有输入预测，纯粹被服务器牵引。" } },
      { from: "authority", to: "simulated", y: 640, kind: "note", label: "📝 关键差异总结（点开看）",
        detail: { h: "三端属性同步的核心差异", src: "Runtime/Engine/Classes/GameFramework/Actor.h:4539", desc: "<b>1. NetRole 状态机</b><br>• Authority: LocalRole==ROLE_Authority, RemoteRole==ROLE_SimulatedProxy<br>• AutonomousProxy: LocalRole==ROLE_AutonomousProxy, RemoteRole==ROLE_Authority<br>• SimulatedProxy: LocalRole==ROLE_SimulatedProxy, RemoteRole==ROLE_Authority<br><br><b>2. Replication Condition (DOREPLIFETIME_CONDITION)</b><br>• COND_OwnerOnly → 只发给拥有该 Actor 的连接<br>• COND_SkipOwner → 除拥有者外所有人<br>• COND_SimulatedOnly → 只发给 SimulatedProxy 端<br>• COND_AutonomousOnly → 只发给 AutonomousProxy 端<br><br><b>3. 客户端处理差异</b><br>• AutonomousProxy: 有输入权，做预测，收服务器数据用于纠错<br>• SimulatedProxy: 无输入权，收服务器数据直接展示（含插值）" } }
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
      { from: "authority", to: "simulated", y: 120, kind: "note", label: "━━━━━ ① Server RPC (客户端 → 服务端) ━━━━━",
        detail: { h: "Server RPC 场景", src: "", desc: "典型场景：玩家按下开火键 → 客户端调 <code>ServerFire()</code> → 服务器收到并做权威判定（是否命中、扣血、扣弹药）。<br><br><b>只能从拥有该 Actor 的客户端调用</b>——即 AutonomousProxy 端。<br>SimulatedProxy 上调 ServerRPC 会被 <code>Actor->GetNetConnection()</code> 返回 nullptr 而丢弃。" } },
      { from: "autonomous", to: "autonomous", y: 200, kind: "internal", label: "游戏代码: MyPawn->ServerFire() (进入 UHT 生成的 thunk)",
        detail: { h: "RPC 入口", src: "Runtime/Engine/Private/Actor.cpp:5242", desc: "thunk 内部调 <code>AActor::CallRemoteFunction</code>。<br>UHT 生成的 <code>ServerFire</code> 会先检查 <code>GetNetMode() != NM_Client</code>：<br>• 服务端调 → 直接跳转到 <code>ServerFire_Implementation</code>（本地执行）<br>• 客户端调 → 走网络路径" } },
      { from: "autonomous", to: "authority", y: 280, kind: "rpc", label: "🔴 Reliable Bunch (含 FieldNetIndex + 参数)",
        detail: { h: "Server RPC 上传", src: "Runtime/Engine/Private/NetDriver.cpp:2593", desc: "源码实证：<code>ProcessRemoteFunctionForChannelPrivate</code> 里若 <code>FUNC_NetReliable</code> → <code>Bunch.bReliable = 1</code>。<br><br>⚠️ 可靠 Bunch 会存在 <code>UNetConnection::OutRec</code> 链表里，直到收到 ACK 才释放；丢包会自动重发。<br>不可靠 Server RPC 不入 OutRec，丢了就丢了。" } },
      { from: "authority", to: "authority", y: 350, kind: "internal", label: "ProcessBunch → ClassCache 查 UFunction → ServerFire_Validate",
        detail: { h: "服务端安全校验", src: "", desc: "带 <code>WithValidation</code> 的 Server RPC 必须提供 <code>ServerFire_Validate</code>。返回 false → 服务器<b>直接踢出该客户端</b>。<br><br>典型防作弊场景：客户端上报 \"我扣了敌人 999999 点血\" → Validate 检查伤害数值上限 → false → 踢。" } },
      { from: "authority", to: "authority", y: 420, kind: "internal", label: "ProcessEvent → ServerFire_Implementation (真正业务逻辑)",
        detail: { h: "服务端执行", src: "", desc: "服务端在此做权威判定：射线检测、伤害计算、扣弹药。<br><br>Implementation 里若改了 Replicated 属性，会通过下一次 ServerReplicateActors 分发给<b>所有</b>相关客户端（含 AutonomousProxy 自己）。" } },
      { from: "authority", to: "simulated", y: 510, kind: "note", label: "━━━━━ ② Client RPC (服务端 → 单个拥有者客户端) ━━━━━",
        detail: { h: "Client RPC 场景", src: "", desc: "典型场景：服务器判定\"你被击中了\" → 调 <code>ClientPlayHitSound()</code> → 只在受害玩家自己屏幕上播放特效/UI。<br><br><b>只发给该 Actor 的 OwningConnection</b>（即 AutonomousProxy 那个连接），不广播。" } },
      { from: "authority", to: "authority", y: 580, kind: "internal", label: "服务端: MyPC->ClientShowDamage(50)",
        detail: { h: "Client RPC 派发", src: "Runtime/Engine/Private/NetDriver.cpp:7418", desc: "<code>UNetDriver::ProcessRemoteFunction</code> 通过 <code>Actor->GetNetConnection()</code> 找目标——通常是 PlayerController 的 NetConnection。找不到 (Actor 无 owner) → 静默丢弃。" } },
      { from: "authority", to: "autonomous", y: 650, kind: "rpc", label: "📨 Client RPC Bunch",
        detail: { h: "服务端 → 主控客户端", src: "", desc: "只发一份，只发给 AutonomousProxy 那个连接。SimulatedProxy 端<b>永远收不到别人的 Client RPC</b>——这也是数据私密性的天然保障。" } },
      { from: "autonomous", to: "autonomous", y: 720, kind: "internal", label: "ProcessBunch → ClientShowDamage_Implementation",
        detail: { h: "客户端执行", src: "", desc: "客户端在此播放伤害数字飘字、震屏、红屏效果——<b>纯表现层</b>，不改 Replicated 状态。" } },
      { from: "authority", to: "simulated", y: 810, kind: "note", label: "━━━━━ ③ NetMulticast RPC (服务端 → 所有相关客户端) ━━━━━",
        detail: { h: "Multicast RPC 场景", src: "", desc: "典型场景：<code>MulticastPlayExplosion(Location)</code> — 所有能\"看到\"这个 Actor 的客户端都播放爆炸特效。<br><br>⚠️ Multicast 也遵循<b>网络相关性</b>——远处的客户端如果对该 Actor 无 Channel，就收不到。" } },
      { from: "authority", to: "authority", y: 880, kind: "internal", label: "服务端: Bomb->MulticastPlayExplosion() 遍历所有 Connections",
        detail: { h: "Multicast 派发", src: "Runtime/Engine/Private/NetDriver.cpp:2820", desc: "源码实证的<b>关键优化</b>：<code>QueueBunch = ( !Bunch.bReliable && Function->FunctionFlags & FUNC_NetMulticast )</code>。<br><br>不可靠 Multicast <b>不立即发</b>，而是入队 <code>QueuedExportBunches</code>，等下一次 Actor 的 ReplicateActor 时和属性同步一起发——省 Bunch header + 增加 UDP 合批率。" } },
      { from: "authority", to: "autonomous", y: 960, kind: "rpc", label: "📢 Multicast Bunch → AutonomousProxy",
        detail: { h: "广播给主控客户端", src: "", desc: "服务端会为每个相关 Connection 各生成一份 Bunch——不是\"一份广播\"。<br>如果目标客户端对该 Actor 没打开 Channel（如太远、被遮挡），这个客户端就<b>收不到</b>。" } },
      { from: "authority", to: "simulated", y: 1030, kind: "rpc", label: "📢 Multicast Bunch → SimulatedProxy",
        detail: { h: "广播给旁观客户端", src: "", desc: "同上——SimulatedProxy 也各自收到独立的 Bunch。<br><br>⚠️ 服务端发起 Multicast 时<b>自己也执行一次 Implementation</b>（NM_ListenServer 场景，服务端玩家自己也要看到爆炸）。" } },
      { from: "autonomous", to: "autonomous", y: 1100, kind: "internal", label: "MulticastPlayExplosion_Implementation (播放爆炸特效)",
        detail: { h: "客户端各自播放", src: "", desc: "每个客户端独立播放。爆炸声音、粒子、震屏——纯表现层，不改状态。" } },
      { from: "simulated", to: "simulated", y: 1170, kind: "internal", label: "MulticastPlayExplosion_Implementation",
        detail: { h: "客户端各自播放", src: "", desc: "与 AutonomousProxy 端同步执行。<br><br>💡 若 Multicast 需要让所有玩家状态一致（比如\"炸弹变墙\"），推荐做法是：<b>服务端改 Replicated 属性 + Multicast 只做特效</b>——因为 Multicast 可能因相关性丢失。" } }
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
      { from: "authority", to: "simulated", y: 120, kind: "note", label: "━━━━━ 场景：本地玩家按 W 键前进，服务端权威 + 客户端预测 ━━━━━",
        detail: { h: "CharacterMovementComponent 的三方协作", src: "Runtime/Engine/Private/Components/CharacterMovementComponent.cpp", desc: "这是 UE 网络架构<b>最经典的三方交互</b>——同时涉及：<br>• Server RPC (ServerMove)<br>• Client RPC (ClientAdjustPosition)<br>• 属性同步 (给 SimulatedProxy)<br>• 客户端预测 + 回放<br><br>相关源码：<code>CharacterMovementComponent.cpp:8728 ReplicateMoveToServer</code> · <code>Character.cpp:1840 ServerMove_Implementation</code> · <code>Character.cpp:1924 ClientAdjustPosition_Implementation</code>" } },
      { from: "autonomous", to: "autonomous", y: 220, kind: "internal", label: "T=0ms: 玩家按 W → 生成 FSavedMove (含时间戳/输入)",
        detail: { h: "输入采样", src: "Runtime/Engine/Private/Components/CharacterMovementComponent.cpp", desc: "<code>UCharacterMovementComponent::TickComponent</code> 检测到 <code>ROLE_AutonomousProxy</code>。<br>把本帧输入（Acceleration + Rotation + JumpFlags）打包成一个 <code>FSavedMove_Character</code> 存入 <code>SavedMoves</code> 队列。<br><br>时间戳 <code>TimeStamp</code> 是关键——用于服务端和客户端对齐。" } },
      { from: "autonomous", to: "autonomous", y: 310, kind: "internal", label: "PerformMovement(dt) → 立即在本地移动 Pawn（预测）",
        detail: { h: "本地预测执行", src: "Runtime/Engine/Private/Components/CharacterMovementComponent.cpp:2597", desc: "⚡ <b>关键设计</b>：客户端<b>不等服务器</b>就先移动。这样玩家感觉零延迟。<br><br>PerformMovement 里跑物理、碰撞、爬楼梯，最后写入 Pawn 的 Location。" } },
      { from: "autonomous", to: "autonomous", y: 400, kind: "internal", label: "ReplicateMoveToServer (打包 SavedMove → RPC)",
        detail: { h: "上传输入", src: "Runtime/Engine/Private/Components/CharacterMovementComponent.cpp:8728", desc: "把 SavedMove 里的输入 + <b>本地预测的最终位置</b>（<code>ClientLoc</code>）打包，通过 ServerMove RPC 发给服务端。<br><br>为什么要发本地预测位置？<b>让服务器验证客户端是否作弊/是否需要修正</b>。" } },
      { from: "autonomous", to: "authority", y: 490, kind: "rpc", label: "ServerMove(TimeStamp, Accel, ClientLoc, MoveFlags) [~50ms]",
        detail: { h: "ServerMove RPC", src: "Runtime/Engine/Private/Character.cpp:1840", desc: "源码：<code>ACharacter::ServerMove_Implementation</code> → <code>GetCharacterMovement()->ServerMove_Implementation(TimeStamp, InAccel, ClientLoc, CompressedMoveFlags, ClientRoll, View, ClientMovementBase, ClientBaseBoneName, ClientMovementMode)</code><br><br>Unreliable！——移动 RPC 不可靠，因为下一个 Move 会自动覆盖上一个。丢包了会由 <code>PendingMove</code> 合并到下一次一起发。" } },
      { from: "authority", to: "authority", y: 570, kind: "internal", label: "服务端: MoveAutonomous(TimeStamp, dt, Accel) [权威模拟]",
        detail: { h: "服务端权威执行", src: "Runtime/Engine/Private/Components/CharacterMovementComponent.cpp:9164", desc: "服务端用<b>相同的输入</b>再跑一次 PerformMovement——这次是<b>权威结果</b>。<br><br>由于服务端和客户端跑相同的物理，如果没有异常，两边的位置应该几乎一致。" } },
      { from: "authority", to: "authority", y: 650, kind: "internal", label: "ServerCheckClientError (对比 ClientLoc vs ServerLoc)",
        detail: { h: "差错检测", src: "", desc: "服务端拿到 <code>ClientLoc</code>（客户端预测位置）和自己算出的 <code>ServerLoc</code> 对比。<br>• 差距 &lt; 阈值（<code>MaxPositionErrorSquared</code>）→ 认可客户端位置<br>• 差距 &gt; 阈值 → 判定客户端错了（碰撞不同 / 作弊 / 丢包），准备修正" } },
      { from: "authority", to: "simulated", y: 740, kind: "note", label: "✅ 分支 A: 客户端预测正确 → 什么都不做 (99% 情况)",
        detail: { h: "常见路径", src: "", desc: "如果 ClientLoc ≈ ServerLoc，服务端不发修正 RPC，只把新位置作为 <b>Replicated 属性</b>推给<b>其他</b>客户端（SimulatedProxy）。<br><br>AutonomousProxy 端：本地预测的位置就是最终位置——玩家感觉零延迟。" } },
      { from: "authority", to: "simulated", y: 830, kind: "note", label: "⚠️ 分支 B: 位置误差大 → 服务器发送修正",
        detail: { h: "需要 rollback 的场景", src: "", desc: "例：客户端认为自己冲进了门，但服务端判定门被锁上了 → 服务端要\"拉回\"客户端。" } },
      { from: "authority", to: "autonomous", y: 910, kind: "rpc", label: "🔴 ClientAdjustPosition(TimeStamp, NewLoc, NewVel, ...) [Reliable]",
        detail: { h: "服务端修正 RPC", src: "Runtime/Engine/Private/Character.cpp:1924", desc: "源码：<code>ACharacter::ClientAdjustPosition_Implementation</code> → <code>GetCharacterMovement()->ClientAdjustPosition_Implementation(TimeStamp, NewLoc, NewVel, NewBase, NewBaseBoneName, bHasBase, bBaseRelativePosition, ServerMovementMode)</code><br><br>用 <code>SendClientAdjustment</code> 打包发出。TimeStamp 是关键——告诉客户端\"你 T=X 时刻的预测错了\"。" } },
      { from: "autonomous", to: "autonomous", y: 1000, kind: "internal", label: "客户端: 回滚位置 + 从 SavedMoves 中重放 T 之后的所有输入",
        detail: { h: "预测回放（Replay）", src: "Runtime/Engine/Private/Components/CharacterMovementComponent.cpp:8845", desc: "关键流程：<br>1. 把角色位置直接设为服务端给的 NewLoc<br>2. 从 SavedMoves 队列中丢弃 &lt;= TimeStamp 的 Move（服务器已确认）<br>3. <b>重新执行</b>剩余的 SavedMoves（<code>ServerMove_PerformMovement</code>）——玩家在 T~现在这段时间的输入不能白按<br><br>结果：位置抖一下但输入不丢——这就是 UE 的 <b>Prediction & Reconciliation</b>。" } },
      { from: "authority", to: "simulated", y: 1100, kind: "rpc", label: "📦 属性同步: ReplicatedMovement (Location + Velocity + Rotation)",
        detail: { h: "广播给旁观客户端", src: "Runtime/Engine/Classes/GameFramework/Actor.h", desc: "<code>AActor::ReplicatedMovement</code> (FRepMovement) 是最重要的一个 Replicated 属性——包含位置/速度/旋转。<br><br>Authority 每 <code>NetUpdateFrequency</code> 一次（默认 100Hz，Character 是 100Hz）通过 ServerReplicateActors 主循环推给所有 SimulatedProxy 客户端。<br><br>⚠️ 只有服务端权威位置——客户端预测位置<b>不同步</b>给别人。" } },
      { from: "simulated", to: "simulated", y: 1180, kind: "internal", label: "SmoothClientPosition (向新位置插值 → 视觉平滑)",
        detail: { h: "旁观端平滑", src: "Runtime/Engine/Private/Components/CharacterMovementComponent.cpp", desc: "⚡ SimulatedProxy 端<b>不会瞬移到新位置</b>，因为收到的位置是 100ms 前的服务端快照，直接跳会很刺眼。<br><br>做法：<code>SmoothClientPosition</code> 记录目标位置，每帧向目标插值 (<code>NetworkSmoothingMode::Exponential</code> 默认)。<br><br>这就是为什么<b>玩家感觉自己零延迟，看别人平滑</b>的原因——两套不同的处理逻辑。" } },
      { from: "authority", to: "simulated", y: 1280, kind: "note", label: "📝 三端网络时序小结（点开看）",
        detail: { h: "为什么这么设计", src: "", desc: "<b>核心思想：延迟不可消除，但可以被\"隐藏\"</b><br><br><b>AutonomousProxy 端</b>：<br>• 立即执行 → 0 延迟感<br>• 后台异步等服务端确认<br>• 出错回滚 + 重放 → 输入不丢<br><br><b>SimulatedProxy 端</b>：<br>• 无输入权，纯观察<br>• 收到的是 100ms 前的服务端快照<br>• 通过插值让\"别人\"看起来平滑<br><br><b>Authority 端</b>：<br>• 唯一权威<br>• 用同样输入验证客户端结果<br>• 出错则强制拉回客户端（Reliable RPC）<br>• 广播权威位置给所有 SimulatedProxy<br><br>这套架构叫 <b>Client-side Prediction + Server Reconciliation</b>——从 Quake III 沿用至今，UE 是这套架构在游戏引擎中最完备的实现之一。" } }
    ]
  }

};
