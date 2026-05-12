<template>
  <div class="storyboard-tab">
    <div class="page-header">
      <div>
        <h2 style="display: inline">分镜</h2>
        <span v-if="shots.length" style="margin-left: 8px; color: #909399; font-size: 14px">
          {{ shots.length }} 个镜头，总时长 {{ totalDuration }}s
        </span>
      </div>
      <div class="batch-actions">
        <el-button type="success" :loading="batchCharLoading" @click="handleBatchCharImages" :disabled="!characters.length">
          批量生成人物图片
        </el-button>
        <el-button type="primary" :loading="batchPromptLoading" @click="handleBatchShotPrompts" :disabled="!shots.length" plain>
          批量生成分镜提示词
        </el-button>
        <el-button type="warning" :loading="batchShotLoading" @click="handleBatchShotImages" :disabled="!shots.length">
          批量生成分镜图片
        </el-button>
      </div>
    </div>

    <!-- 人物参照区域 -->
    <div class="character-section">
      <div class="section-title-row">
        <h3 class="section-title">人物参照</h3>
        <el-button size="small" type="primary" @click="openAddCharDialog">+ 添加人物</el-button>
      </div>
      <div v-if="characters.length" class="character-grid">
        <el-card v-for="char in characters" :key="char.id" class="character-card" shadow="hover">
          <!-- 4角度图片展示 -->
          <div class="char-angles" @click="openCharDetail(char)">
            <template v-if="char.reference_images && char.reference_images.length">
              <div v-for="angle in ['front', 'left', 'right', 'back']" :key="angle" class="angle-cell">
                <el-image
                  v-if="getAngleImage(char, angle)"
                  :src="imageUrl(getAngleImage(char, angle))"
                  fit="cover"
                  class="angle-img"
                  @click.stop="previewImage(imageUrl(getAngleImage(char, angle)))"
                />
                <div v-else class="angle-placeholder">
                  <el-icon :size="16" color="#5a6a7e"><User /></el-icon>
                  <span>{{ angleLabel(angle) }}</span>
                </div>
              </div>
            </template>
            <div v-else-if="char.reference_image_path" class="char-image-single" @click.stop="previewImage(imageUrl(char.reference_image_path))">
              <el-image :src="imageUrl(char.reference_image_path)" fit="cover" class="ref-img" />
            </div>
            <div v-else class="char-placeholder">
              <el-icon :size="48" color="#5a6a7e"><User /></el-icon>
              <span class="placeholder-text">待生成参考图</span>
            </div>
          </div>
          <div class="char-info" @click="openCharDetail(char)">
            <div class="char-name-row">
              <span class="char-name">{{ char.name }}</span>
              <el-tag v-if="char.role_type" size="small" type="info">{{ char.role_type }}</el-tag>
            </div>
            <div class="char-tags">
              <span v-if="char.age">{{ char.age }}岁</span>
              <span v-if="char.gender"> · {{ char.gender }}</span>
              <span v-if="char.nationality"> · {{ char.nationality }}</span>
            </div>
          </div>
          <div class="card-actions">
            <el-button size="small" @click.stop="handleGenCharImage(char)"
              :loading="imageLoading === 'char-' + char.id">
              生成图片
            </el-button>
          </div>
        </el-card>
      </div>
      <el-empty v-if="!characters.length" description="暂无人物，点击上方按钮添加" :image-size="60" />
    </div>

    <!-- 人物详情抽屉 -->
    <el-drawer v-model="showCharDetail" title="人物详情" size="500px">
      <template v-if="selectedCharacter">
        <!-- 4角度图片展示 -->
        <div v-if="selectedCharacter.reference_images && selectedCharacter.reference_images.length" class="detail-angles">
          <div v-for="angle in ['front', 'left', 'right', 'back']" :key="angle" class="detail-angle-cell" @click="getAngleImage(selectedCharacter, angle) && previewImage(imageUrl(getAngleImage(selectedCharacter, angle)))">
            <el-image
              v-if="getAngleImage(selectedCharacter, angle)"
              :src="imageUrl(getAngleImage(selectedCharacter, angle))"
              fit="contain"
              class="detail-angle-img"
            />
            <div v-else class="detail-angle-empty">
              <el-icon :size="24" color="#5a6a7e"><User /></el-icon>
            </div>
            <span class="detail-angle-label">{{ angleLabel(angle) }}</span>
          </div>
        </div>
        <div v-else-if="selectedCharacter.reference_image_path" class="char-detail-image">
          <el-image :src="imageUrl(selectedCharacter.reference_image_path)" fit="contain" class="detail-ref-img" @click="previewImage(imageUrl(selectedCharacter.reference_image_path))" />
        </div>
        <div v-else class="char-detail-image">
          <div class="detail-placeholder">
            <el-icon :size="64" color="#5a6a7e"><User /></el-icon>
            <span>暂无参考图</span>
          </div>
        </div>

        <el-form label-position="top" style="margin-top: 16px">
          <el-form-item label="姓名">
            <el-input v-model="charEditForm.name" />
          </el-form-item>
          <el-form-item label="角色类型">
            <el-input v-model="charEditForm.role_type" />
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="8">
              <el-form-item label="年龄">
                <el-input-number v-model="charEditForm.age" :min="0" :max="150" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="性别">
                <el-input v-model="charEditForm.gender" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="国籍/种族">
                <el-input v-model="charEditForm.nationality" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="肤色">
            <el-input v-model="charEditForm.skin_tone" />
          </el-form-item>
          <el-form-item label="外貌特征">
            <el-input v-model="charEditForm.appearance" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="特殊标记">
            <el-input v-model="charEditForm.ethnic_features" />
          </el-form-item>
          <el-form-item label="性格特点">
            <el-input v-model="charEditForm.personality" />
          </el-form-item>
          <el-form-item label="穿着描述">
            <el-input v-model="charEditForm.clothing" type="textarea" :rows="2" />
          </el-form-item>

          <el-divider />

          <el-form-item label="视频风格">
            <el-select v-model="charEditForm.video_style" placeholder="选择视频风格">
              <el-option label="电影级写实" value="cinematic" />
              <el-option label="动漫风格" value="anime" />
              <el-option label="动画风格" value="animation" />
              <el-option label="赛博朋克" value="cyberpunk" />
              <el-option label="油画艺术" value="oil_painting" />
            </el-select>
          </el-form-item>
          <el-form-item label="参考图提示词">
            <el-input v-model="charEditForm.reference_prompt_cn" type="textarea" :rows="4" placeholder="用于文生图的提示词，留空则自动生成" />
          </el-form-item>
          <el-form-item label="图片宽高比">
            <el-radio-group v-model="charEditForm.aspect_ratio">
              <el-radio value="9:16">9:16（竖屏）</el-radio>
              <el-radio value="16:9">16:9（横屏）</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSaveCharacter" :loading="savingChar">保存修改</el-button>
            <el-button @click="handleGenCharImage(selectedCharacter)" :loading="imageLoading === 'char-' + selectedCharacter.id">
              {{ selectedCharacter.reference_images && selectedCharacter.reference_images.length ? '重新生成4角度图' : '生成4角度图' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div v-if="selectedCharacter.periods && selectedCharacter.periods.length" class="detail-periods">
          <h4>穿着变化</h4>
          <el-timeline>
            <el-timeline-item v-for="period in selectedCharacter.periods" :key="period.id"
              :timestamp="period.period_name" placement="top">
              {{ period.clothing_delta || '无描述' }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>
    </el-drawer>

    <!-- 添加人物对话框 -->
    <el-dialog v-model="showAddCharDialog" title="添加人物" width="520px" @close="resetAddCharForm">
      <el-form :model="addCharForm" label-position="top">
        <el-form-item label="姓名" required>
          <el-input v-model="addCharForm.name" placeholder="角色姓名" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="年龄">
              <el-input-number v-model="addCharForm.age" :min="0" :max="150" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="性别">
              <el-input v-model="addCharForm.gender" placeholder="如：男" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="国籍/种族">
              <el-input v-model="addCharForm.nationality" placeholder="如：中国汉族" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="肤色">
          <el-input v-model="addCharForm.skin_tone" placeholder="如：白皙、黝黑" />
        </el-form-item>
        <el-form-item label="外貌特征">
          <el-input v-model="addCharForm.appearance" type="textarea" :rows="3" placeholder="眼睛、发型、脸型、体型等描述" />
        </el-form-item>
        <el-form-item label="穿着描述">
          <el-input v-model="addCharForm.clothing" type="textarea" :rows="2" placeholder="角色穿着" />
        </el-form-item>
        <el-form-item label="视频风格">
          <el-select v-model="addCharForm.video_style" style="width: 100%">
            <el-option label="电影级写实" value="cinematic" />
            <el-option label="动漫风格" value="anime" />
            <el-option label="动画风格" value="animation" />
            <el-option label="赛博朋克" value="cyberpunk" />
            <el-option label="油画艺术" value="oil_painting" />
          </el-select>
        </el-form-item>
        <el-form-item label="参考图提示词">
          <el-input v-model="addCharForm.reference_prompt_cn" type="textarea" :rows="3" placeholder="文生图提示词，留空则可后续由 AI 自动生成" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddCharDialog = false">取消</el-button>
        <el-button type="primary" :loading="addingChar" @click="handleAddCharacter">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 场景参照区域 -->
    <div class="scene-section">
      <div class="section-title-row">
        <h3 class="section-title">场景参照</h3>
        <el-button size="small" type="primary" @click="showAddSceneDialog = true">+ 添加场景</el-button>
      </div>
      <div v-if="scenes.length" class="scene-grid">
        <el-card v-for="scene in scenes" :key="scene.id" class="scene-card" shadow="hover" @click="openSceneDetail(scene)">
          <div class="scene-image" @click.stop="previewSceneImage(scene)">
            <el-image v-if="scene.image_path" :src="imageUrl(scene.image_path)" fit="cover" class="scene-img" />
            <div v-else class="scene-placeholder">
              <el-icon :size="32" color="#5a6a7e"><Picture /></el-icon>
              <span class="placeholder-text">待生成</span>
            </div>
          </div>
          <div class="scene-info">
            <div class="scene-name">{{ scene.name }}</div>
            <div v-if="scene.location" class="scene-meta">{{ scene.location }}</div>
            <div v-if="scene.tone || scene.mood" class="scene-meta">
              <span v-if="scene.tone">{{ scene.tone }}</span>
              <span v-if="scene.tone && scene.mood"> · </span>
              <span v-if="scene.mood">{{ scene.mood }}</span>
            </div>
          </div>
          <div class="card-actions">
            <el-button size="small" @click.stop="handleGenSceneImage(scene)"
              :loading="imageLoading === 'scene-' + scene.id">
              生成图片
            </el-button>
            <el-button size="small" type="danger" text @click.stop="handleDeleteScene(scene)">
              删除
            </el-button>
          </div>
        </el-card>
      </div>
      <el-empty v-else description="暂无场景，点击上方按钮添加" :image-size="60" />
    </div>

    <!-- 添加场景对话框 -->
    <el-dialog v-model="showAddSceneDialog" title="添加场景" width="520px" @close="resetAddSceneForm">
      <el-form :model="addSceneForm" label-position="top">
        <el-form-item label="场景名称" required>
          <el-input v-model="addSceneForm.name" placeholder="如：出租屋、海滩" />
        </el-form-item>
        <el-form-item label="地点">
          <el-input v-model="addSceneForm.location" placeholder="如：城市边缘、烟台金沙滩" />
        </el-form-item>
        <el-form-item label="环境描述">
          <el-input v-model="addSceneForm.environment" type="textarea" :rows="3" placeholder="光线、色调、具体物件等" />
        </el-form-item>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="画面色调">
              <el-input v-model="addSceneForm.tone" placeholder="如：暗黄色、暖橘色" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="氛围">
              <el-input v-model="addSceneForm.mood" placeholder="如：压抑、温馨" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="文生图提示词">
          <el-input v-model="addSceneForm.image_prompt" type="textarea" :rows="3" placeholder="场景的文生图提示词，留空则后续填写" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddSceneDialog = false">取消</el-button>
        <el-button type="primary" :loading="addingScene" @click="handleAddScene">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 分镜卡片 -->
    <div class="section-title-row" style="margin-top: 24px">
      <h3 v-if="characters.length && shots.length" class="section-title" style="margin-bottom: 0">分镜列表</h3>
      <template v-if="selectMode">
        <el-button size="small" @click="selectAllShots">全选</el-button>
        <el-button size="small" @click="deselectAllShots">反选</el-button>
        <el-button size="small" type="primary" @click="confirmSelection">确认</el-button>
        <el-button size="small" @click="cancelSelection">取消</el-button>
        <span style="color: #909399; font-size: 13px; margin-left: 8px">
          已选 {{ selectedShotIds.size }}/{{ shots.length }}
        </span>
      </template>
    </div>

    <el-empty v-if="!shots.length && !generating" description="暂无分镜，请点击 AI 生成分镜" />

    <div class="shot-grid">
      <el-card v-for="(shot, index) in shots" :key="shot.id" class="shot-card"
        :class="{ active: selectedShot?.id === shot.id, selected: selectMode && selectedShotIds.has(shot.id) }"
        @click="selectMode ? toggleShotSelect(shot) : (selectedShot = shot)">
        <div v-if="selectMode" class="shot-checkbox" @click.stop="toggleShotSelect(shot)">
          <el-checkbox :model-value="selectedShotIds.has(shot.id)" />
        </div>
        <div class="shot-index">#{{ Number(index) + 1 }}</div>
        <div class="shot-thumb" @click.stop="shot.image_path && previewImage(imageUrl(shot.image_path))">
          <el-image v-if="shot.image_path" :src="imageUrl(shot.image_path)" fit="cover" class="thumb-img" />
          <el-icon v-else :size="40" color="#c0c4cc"><Picture /></el-icon>
        </div>
        <div class="shot-meta">
          <el-tag size="small" type="info">{{ shot.shot_type || '—' }}</el-tag>
          <span class="shot-time">{{ shot.time_range || `${shot.video_duration || 3}s` }}</span>
        </div>
        <div class="shot-desc">{{ shot.description || '无描述' }}</div>
        <div v-if="shot.characters" class="shot-chars">
          <el-tag v-for="name in shot.characters.split(',')" :key="name" size="small" type="warning" style="margin-right: 4px">{{ name.trim() }}</el-tag>
        </div>
        <div class="shot-status">
          <el-tag size="small" :type="shotStatusType(shot)">
            {{ shotStatusLabel(shot) }}
          </el-tag>
        </div>
        <div class="card-actions">
          <el-button size="small" @click.stop="handleGenShotPrompt(shot)"
            :loading="promptLoading === 'shot-' + shot.id">
            生成提示词
          </el-button>
          <el-button size="small" @click.stop="handleGenShotImage(shot)"
            :loading="imageLoading === 'shot-' + shot.id"
            :disabled="!shot.image_prompt">
            生成图片
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 场景详情抽屉 -->
    <el-drawer v-model="showSceneDetail" title="场景详情" size="500px">
      <template v-if="selectedScene">
        <div class="detail-preview-box">
          <el-image v-if="selectedScene.image_path" :src="imageUrl(selectedScene.image_path)" fit="contain"
            class="detail-ref-img" @click="previewImage(imageUrl(selectedScene.image_path))" />
          <div v-else class="detail-placeholder">
            <el-icon :size="64" color="#5a6a7e"><Picture /></el-icon>
            <span>暂无场景图片</span>
          </div>
        </div>

        <el-form label-position="top" style="margin-top: 16px">
          <el-form-item label="场景名称">
            <el-input v-model="sceneEditForm.name" />
          </el-form-item>
          <el-form-item label="地点">
            <el-input v-model="sceneEditForm.location" placeholder="如：城市边缘、烟台金沙滩" />
          </el-form-item>
          <el-form-item label="环境描述">
            <el-input v-model="sceneEditForm.environment" type="textarea" :rows="3" placeholder="光线、色调、具体物件等" />
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="画面色调">
                <el-input v-model="sceneEditForm.tone" placeholder="如：暗黄色、暖橘色" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="氛围">
                <el-input v-model="sceneEditForm.mood" placeholder="如：压抑、温馨" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider />

          <el-form-item label="文生图提示词">
            <el-input v-model="sceneEditForm.image_prompt" type="textarea" :rows="4" placeholder="用于文生图的提示词" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSaveScene" :loading="savingScene">保存修改</el-button>
            <el-button @click="handleGenSceneImage(selectedScene)" :loading="imageLoading === 'scene-' + selectedScene.id">
              {{ selectedScene.image_path ? '重新生成图片' : '生成图片' }}
            </el-button>
          </el-form-item>
        </el-form>
      </template>
    </el-drawer>

    <!-- 镜头详情抽屉 -->
    <el-drawer v-model="showDetail" title="镜头详情" size="500px">
      <template v-if="selectedShot">
        <div class="detail-preview-box">
          <el-image v-if="selectedShot.image_path" :src="imageUrl(selectedShot.image_path)" fit="contain"
            class="detail-ref-img" @click="previewImage(imageUrl(selectedShot.image_path))" />
          <div v-else class="detail-placeholder">
            <el-icon :size="64" color="#5a6a7e"><Picture /></el-icon>
            <span>暂无图片</span>
          </div>
        </div>

        <el-form label-position="top">
          <el-form-item label="关联场景">
            <el-select v-model="editForm.scene_id" clearable placeholder="选择场景参照" style="width: 100%">
              <el-option
                v-for="scene in scenes"
                :key="scene.id"
                :label="scene.name + (scene.location ? ' (' + scene.location + ')' : '')"
                :value="scene.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="画面描述">
            <el-input v-model="editForm.description" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="出场人物">
            <el-input v-model="editForm.characters" placeholder="人物名称，逗号分隔" @blur="rebuildCharacterAngles" />
          </el-form-item>
          <el-form-item v-if="shotCharacterList.length" label="人物角度">
            <div class="char-angle-grid">
              <div v-for="cname in shotCharacterList" :key="cname" class="char-angle-row">
                <span class="char-angle-name">{{ cname }}</span>
                <el-radio-group :model-value="getCharAngle(cname)" @change="(v: string) => setCharAngle(cname, v)" size="small">
                  <el-radio-button value="front">正面</el-radio-button>
                  <el-radio-button value="left">左侧</el-radio-button>
                  <el-radio-button value="right">右侧</el-radio-button>
                  <el-radio-button value="back">背面</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="镜头类型">
            <el-select v-model="editForm.shot_type">
              <el-option label="特写" value="close_up" />
              <el-option label="近景" value="medium_close_up" />
              <el-option label="中景" value="medium" />
              <el-option label="全景" value="wide" />
              <el-option label="大远景" value="establishing" />
            </el-select>
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="色调">
                <el-input v-model="editForm.tone" placeholder="如：暖黄、冷蓝" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="氛围">
                <el-input v-model="editForm.mood" placeholder="如：温馨、压抑" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="台词">
            <el-input v-model="editForm.dialog" placeholder="角色台词（可选）" />
          </el-form-item>
          <el-form-item label="时长（秒）">
            <el-input-number v-model="editForm.video_duration" :min="1" :max="30" />
          </el-form-item>
          <el-form-item label="视频风格">
            <el-select v-model="editForm.video_style" placeholder="选择视频风格">
              <el-option label="电影级写实" value="cinematic" />
              <el-option label="动漫风格" value="anime" />
              <el-option label="动画风格" value="animation" />
              <el-option label="赛博朋克" value="cyberpunk" />
              <el-option label="油画艺术" value="oil_painting" />
            </el-select>
          </el-form-item>
          <el-form-item label="Image Prompt">
            <el-input v-model="editForm.image_prompt" type="textarea" :rows="4" />
          </el-form-item>
          <el-form-item label="Video Prompt">
            <el-input v-model="editForm.video_prompt" type="textarea" :rows="4" />
          </el-form-item>
          <el-form-item label="图片宽高比">
            <el-radio-group v-model="editForm.aspect_ratio">
              <el-radio value="9:16">9:16（竖屏）</el-radio>
              <el-radio value="16:9">16:9（横屏）</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSaveShot" :loading="savingShot">保存修改</el-button>
            <el-button v-if="selectedShot.image_path" @click="handleRegenImage" :loading="regenImage">
              重新生成图片
            </el-button>
            <el-button v-if="selectedShot.video_path" @click="handleRegenVideo" :loading="regenVideo">
              重新生成视频
            </el-button>
          </el-form-item>
        </el-form>
      </template>
    </el-drawer>

    <!-- 批量生成进度弹窗 -->
    <el-dialog v-model="showProgressDialog" :title="progressTitle" width="460px" :close-on-click-modal="false" :show-close="progressStatus === 'completed' || progressStatus === 'failed'" @closed="onProgressDialogClosed">
      <div style="text-align: center; padding: 16px 0">
        <el-progress :percentage="progressPercent" :status="progressStatus === 'failed' ? 'exception' : progressStatus === 'completed' ? 'success' : undefined" :stroke-width="20" :text-inside="true" style="margin-bottom: 16px" />
        <p style="color: #606266; font-size: 14px">{{ progressMessage }}</p>
      </div>
      <template #footer>
        <el-button v-if="progressStatus === 'completed' || progressStatus === 'failed'" @click="showProgressDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 图片预览弹窗 -->
    <el-dialog v-model="showImagePreview" title="图片预览" width="auto" style="max-width: 90vw">
      <div style="text-align: center">
        <img :src="previewImageUrl" style="max-width: 100%; max-height: 75vh; object-fit: contain" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, User } from '@element-plus/icons-vue'
import {
  createStoryboard, updateShot, regenerateImage, regenerateVideo,
  generateShotPrompt, generateShotImage,
} from '../../api/storyboard'
import {
  getCharacters, createCharacter, updateCharacter, generateCharMultiAngle,
} from '../../api/character'
import {
  getScenes, createScene, deleteScene, generateSceneImage as generateSceneImageApi,
} from '../../api/scene'
import {
  batchGenerateCharacterImages, batchGenerateShotImages, batchGenerateShotPrompts, getTask,
} from '../../api/generation'

const props = defineProps<{
  projectId: string
  scriptId: string | undefined
  storyboard: any
}>()

const emit = defineEmits<{ refresh: [] }>()

const shots = computed(() => props.storyboard?.shots || [])
const totalDuration = computed(() => {
  const list = shots.value
  return Array.isArray(list) ? list.reduce((sum: number, s: any) => sum + (s.video_duration || 3), 0) : 0
})

const characters = ref<any[]>([])
const generating = ref(false)
const selectedShot = ref<any>(null)
const selectedCharacter = ref<any>(null)
const showDetail = ref(false)
const showCharDetail = ref(false)
const selectedScene = ref<any>(null)
const showSceneDetail = ref(false)
const savingScene = ref(false)
const savingShot = ref(false)
const savingChar = ref(false)
const regenImage = ref(false)
const regenVideo = ref(false)

// 添加人物
const showAddCharDialog = ref(false)
const addingChar = ref(false)
const addCharForm = reactive({
  name: '',
  age: null as number | null,
  gender: '',
  nationality: '',
  skin_tone: '',
  appearance: '',
  clothing: '',
  video_style: 'cinematic',
  reference_prompt_cn: '',
})

// 场景参照
const scenes = ref<any[]>([])
const showAddSceneDialog = ref(false)
const addingScene = ref(false)
const addSceneForm = reactive({
  name: '',
  location: '',
  environment: '',
  tone: '',
  mood: '',
  image_prompt: '',
})

// 批量生成
const batchCharLoading = ref(false)
const batchPromptLoading = ref(false)
const batchShotLoading = ref(false)
const showProgressDialog = ref(false)
const progressTitle = ref('')
const progressPercent = ref(0)
const progressMessage = ref('')
const progressStatus = ref<'running' | 'completed' | 'failed'>('running')
let progressTimer: ReturnType<typeof setInterval> | null = null

// 图片预览
const showImagePreview = ref(false)
const previewImageUrl = ref('')

// 每个 card 的 loading 状态，格式为 'char-1' 或 'shot-5'
const promptLoading = ref<string | null>(null)
const imageLoading = ref<string | null>(null)

// 选择模式
const selectMode = ref(false)
const selectType = ref<'prompt' | 'image'>('prompt')
const selectedShotIds = ref<Set<number>>(new Set())

const editForm = reactive({
  description: '',
  characters: '',
  character_angles: '' as string,
  shot_type: '',
  tone: '',
  mood: '',
  dialog: '',
  video_duration: 3,
  image_prompt: '',
  video_prompt: '',
  aspect_ratio: '9:16',
  video_style: 'cinematic',
  scene_id: null as number | null,
})

const charEditForm = reactive({
  name: '',
  role_type: '',
  age: null as number | null,
  gender: '',
  nationality: '',
  skin_tone: '',
  appearance: '',
  ethnic_features: '',
  personality: '',
  clothing: '',
  reference_prompt_cn: '',
  aspect_ratio: '9:16',
  video_style: 'cinematic',
})

const sceneEditForm = reactive({
  name: '',
  location: '',
  environment: '',
  tone: '',
  mood: '',
  image_prompt: '',
})

onMounted(() => {
  loadCharacters()
  loadScenes()
})

onUnmounted(() => {
  stopPolling()
})

async function loadCharacters() {
  if (!props.projectId) return
  try {
    const res: any = await getCharacters(props.projectId)
    characters.value = res.items || res.data || res || []
  } catch {
    characters.value = []
  }
}

async function loadScenes() {
  if (!props.projectId) return
  try {
    const res: any = await getScenes(props.projectId)
    scenes.value = res.items || res.data || res || []
  } catch {
    scenes.value = []
  }
}

// 人物角度辅助
const shotCharacterList = computed(() => {
  const raw = editForm.characters
  if (!raw) return []
  return raw.split(',').map((s: string) => s.trim()).filter(Boolean)
})

function parseCharAngles(): Map<string, string> {
  const map = new Map<string, string>()
  if (!editForm.character_angles) return map
  for (const entry of editForm.character_angles.split(',')) {
    const [name, angle] = entry.split(':').map(s => s.trim())
    if (name && angle) map.set(name, angle)
  }
  return map
}

function getCharAngle(name: string): string {
  return parseCharAngles().get(name) || 'front'
}

function setCharAngle(name: string, angle: string) {
  const map = parseCharAngles()
  map.set(name, angle)
  editForm.character_angles = Array.from(map.entries()).map(([n, a]) => `${n}:${a}`).join(',')
}

function rebuildCharacterAngles() {
  const names = shotCharacterList.value
  if (!names.length) {
    editForm.character_angles = ''
    return
  }
  const map = parseCharAngles()
  editForm.character_angles = names.map(n => `${n}:${map.get(n) || 'front'}`).join(',')
}

function openCharDetail(char: any) {
  selectedCharacter.value = char
  charEditForm.name = char.name || ''
  charEditForm.role_type = char.role_type || ''
  charEditForm.age = char.age || null
  charEditForm.gender = char.gender || ''
  charEditForm.nationality = char.nationality || ''
  charEditForm.skin_tone = char.skin_tone || ''
  charEditForm.appearance = char.appearance || ''
  charEditForm.ethnic_features = char.ethnic_features || ''
  charEditForm.personality = char.personality || ''
  charEditForm.clothing = char.clothing || ''
  charEditForm.reference_prompt_cn = char.reference_prompt_cn || ''
  charEditForm.aspect_ratio = '9:16'
  charEditForm.video_style = char.video_style || 'cinematic'
  showCharDetail.value = true
}

watch(selectedShot, (s) => {
  if (s) {
    editForm.description = s.description || ''
    editForm.characters = s.characters || ''
    editForm.character_angles = s.character_angles || ''
    editForm.shot_type = s.shot_type || ''
    editForm.tone = s.tone || ''
    editForm.mood = s.mood || ''
    editForm.dialog = s.dialog || ''
    editForm.video_duration = s.video_duration || 3
    editForm.image_prompt = s.image_prompt || ''
    editForm.video_prompt = s.video_prompt || ''
    editForm.aspect_ratio = '9:16'
    editForm.video_style = s.video_style || 'cinematic'
    editForm.scene_id = s.scene_id || null
    showDetail.value = true
  }
})

// ─── 人物操作 ───

function openAddCharDialog() {
  resetAddCharForm()
  showAddCharDialog.value = true
}

function resetAddCharForm() {
  addCharForm.name = ''
  addCharForm.age = null
  addCharForm.gender = ''
  addCharForm.nationality = ''
  addCharForm.skin_tone = ''
  addCharForm.appearance = ''
  addCharForm.clothing = ''
  addCharForm.video_style = 'cinematic'
  addCharForm.reference_prompt_cn = ''
}

async function handleAddCharacter() {
  if (!addCharForm.name.trim()) {
    ElMessage.warning('请输入人物姓名')
    return
  }
  addingChar.value = true
  try {
    await createCharacter(props.projectId, { ...addCharForm })
    ElMessage.success('人物添加成功')
    showAddCharDialog.value = false
    await loadCharacters()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.detail || '添加失败')
  } finally {
    addingChar.value = false
  }
}

async function handleGenCharImage(char: any) {
  const key = `char-${char.id}`
  imageLoading.value = key
  try {
    // 先保存视频风格到角色
    if (selectedCharacter.value && char.id === selectedCharacter.value.id) {
      const { aspect_ratio, ...data } = charEditForm
      await updateCharacter(char.id, data)
    }
    const data: any = await generateCharMultiAngle(char.id, { aspect_ratio: charEditForm.aspect_ratio || '9:16' })
    if (!data.task_id) {
      ElMessage.info(data.message || '生成失败')
      return
    }
    startProgressPolling(data.task_id, `生成 ${char.name} 4角度图`, data.total || 4)
  } catch {
    ElMessage.error('图片生成失败')
  } finally {
    imageLoading.value = null
  }
}

// ─── 场景操作 ───

function resetAddSceneForm() {
  addSceneForm.name = ''
  addSceneForm.location = ''
  addSceneForm.environment = ''
  addSceneForm.tone = ''
  addSceneForm.mood = ''
  addSceneForm.image_prompt = ''
}

async function handleAddScene() {
  if (!addSceneForm.name.trim()) {
    ElMessage.warning('请输入场景名称')
    return
  }
  addingScene.value = true
  try {
    await createScene(props.projectId, { ...addSceneForm })
    ElMessage.success('场景添加成功')
    showAddSceneDialog.value = false
    await loadScenes()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.detail || '添加失败')
  } finally {
    addingScene.value = false
  }
}

async function handleGenSceneImage(scene: any) {
  if (!scene.image_prompt) {
    ElMessage.warning('请先设置场景的文生图提示词')
    return
  }
  const key = `scene-${scene.id}`
  imageLoading.value = key
  try {
    const data: any = await generateSceneImageApi(scene.id)
    if (data.task_id) {
      startProgressPolling(data.task_id, `生成场景「${scene.name}」图片`, 1)
    } else if (data.image_path) {
      ElMessage.success('场景图片生成成功')
      await loadScenes()
    }
  } catch {
    ElMessage.error('场景图片生成失败')
  } finally {
    imageLoading.value = null
  }
}

async function handleDeleteScene(scene: any) {
  try {
    await ElMessageBox.confirm(`确定删除场景「${scene.name}」？`, '确认', { type: 'warning' })
    await deleteScene(scene.id)
    ElMessage.success('已删除')
    await loadScenes()
  } catch { /* cancelled */ }
}

function openSceneDetail(scene: any) {
  selectedScene.value = scene
  sceneEditForm.name = scene.name || ''
  sceneEditForm.location = scene.location || ''
  sceneEditForm.environment = scene.environment || ''
  sceneEditForm.tone = scene.tone || ''
  sceneEditForm.mood = scene.mood || ''
  sceneEditForm.image_prompt = scene.image_prompt || ''
  showSceneDetail.value = true
}

function previewSceneImage(scene: any) {
  if (scene.image_path) {
    previewImageUrl.value = imageUrl(scene.image_path)
    showImagePreview.value = true
  }
}

async function handleSaveScene() {
  if (!selectedScene.value) return
  savingScene.value = true
  try {
    await updateScene(selectedScene.value.id, { ...sceneEditForm })
    ElMessage.success('场景已保存')
    showSceneDetail.value = false
    await loadScenes()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.detail || '保存失败')
  } finally {
    savingScene.value = false
  }
}

function getAngleImage(char: any, angle: string): string | null {
  if (!char.reference_images) return null
  const ref = char.reference_images.find((r: any) => r.angle === angle && r.image_path && r.status === 'completed')
  return ref?.image_path || null
}

function angleLabel(angle: string): string {
  const map: Record<string, string> = { front: '正面', left: '左侧', right: '右侧', back: '背面' }
  return map[angle] || angle
}

async function handleSaveCharacter() {
  if (!selectedCharacter.value) return
  savingChar.value = true
  try {
    const { aspect_ratio, ...data } = charEditForm
    await updateCharacter(selectedCharacter.value.id, data)
    ElMessage.success('已保存')
    loadCharacters()
  } finally {
    savingChar.value = false
  }
}

// ─── 镜头操作 ───

async function handleGenShotPrompt(shot: any) {
  const key = `shot-${shot.id}`
  promptLoading.value = key
  try {
    // 先保存视频风格到镜头
    if (selectedShot.value && shot.id === selectedShot.value.id) {
      const { aspect_ratio, ...data } = editForm
      await updateShot(shot.id, data)
    }
    await generateShotPrompt(shot.id)
    ElMessage.success('提示词生成成功')
    emit('refresh')
  } catch {
    ElMessage.error('提示词生成失败')
  } finally {
    promptLoading.value = null
  }
}

async function handleGenShotImage(shot: any) {
  const key = `shot-${shot.id}`
  imageLoading.value = key
  try {
    const res = await generateShotImage(shot.id)
    const taskId = res?.task_id
    if (taskId) {
      // Poll task status until completed
      for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 3000))
        const task = await getTask(taskId)
        if (task.status === 'completed' || task.status === 'success') {
          ElMessage.success('图片生成成功')
          emit('refresh')
          return
        }
        if (task.status === 'failed') {
          ElMessage.error('图片生成失败: ' + (task.error_message || '未知错误'))
          emit('refresh')
          return
        }
      }
      ElMessage.warning('图片生成超时，请稍后刷新查看')
    } else {
      ElMessage.success('图片生成任务已提交')
    }
    emit('refresh')
  } catch {
    ElMessage.error('图片生成失败')
  } finally {
    imageLoading.value = null
  }
}

async function handleGenerate() {
  if (!props.scriptId) return
  generating.value = true
  try {
    await createStoryboard(props.scriptId)
    ElMessage.success('分镜生成成功')
    emit('refresh')
    loadCharacters()
  } finally {
    generating.value = false
  }
}

// ─── 批量生成 ───

function startProgressPolling(taskId: string, title: string, total: number) {
  progressTitle.value = title
  progressPercent.value = 0
  progressMessage.value = `正在生成 0/${total} ...`
  progressStatus.value = 'running'
  showProgressDialog.value = true

  if (progressTimer) clearInterval(progressTimer)
  progressTimer = setInterval(async () => {
    try {
      const data: any = await getTask(taskId)
      const progress = data.progress ?? 0
      progressPercent.value = progress
      progressMessage.value = data.message || `正在生成 ... ${progress}%`

      if (data.status === 'completed') {
        progressStatus.value = 'completed'
        progressPercent.value = 100
        progressMessage.value = '生成完成'
        stopPolling()
        loadCharacters()
        emit('refresh')
      } else if (data.status === 'failed') {
        progressStatus.value = 'failed'
        progressMessage.value = data.error_message || '生成失败'
        stopPolling()
      }
    } catch {
      // 忽略轮询错误
    }
  }, 2000)
}

function stopPolling() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

function onProgressDialogClosed() {
  loadCharacters()
  emit('refresh')
}

function enterSelectMode(type: 'prompt' | 'image') {
  selectMode.value = true
  selectType.value = type
  selectedShotIds.value = new Set()
}

function cancelSelection() {
  selectMode.value = false
  selectedShotIds.value = new Set()
}

function toggleShotSelect(shot: any) {
  const ids = new Set(selectedShotIds.value)
  if (ids.has(shot.id)) {
    ids.delete(shot.id)
  } else {
    ids.add(shot.id)
  }
  selectedShotIds.value = ids
}

function selectAllShots() {
  selectedShotIds.value = new Set(shots.value.map((s: any) => s.id))
}

function deselectAllShots() {
  selectedShotIds.value = new Set()
}

async function confirmSelection() {
  const ids = Array.from(selectedShotIds.value)
  if (!ids.length) {
    ElMessage.warning('请先选择要生成的分镜')
    return
  }

  const actionLabel = selectType.value === 'prompt' ? '提示词' : '图片'
  try {
    await ElMessageBox.confirm(
      `将为选中的 ${ids.length} 个分镜批量生成${actionLabel}，是否继续？`,
      '确认',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'info' },
    )
  } catch {
    return
  }

  selectMode.value = false

  if (selectType.value === 'prompt') {
    batchPromptLoading.value = true
    try {
      const data: any = await batchGenerateShotPrompts(props.projectId!, { shot_ids: ids })
      if (!data.task_id) {
        ElMessage.info(data.message || '没有需要生成提示词的分镜')
        return
      }
      startProgressPolling(data.task_id, '批量生成分镜提示词', data.total || ids.length)
    } catch {
      ElMessage.error('批量生成分镜提示词失败')
    } finally {
      batchPromptLoading.value = false
    }
  } else {
    batchShotLoading.value = true
    try {
      const data: any = await batchGenerateShotImages(props.projectId!, { shot_ids: ids })
      if (!data.task_id) {
        ElMessage.info(data.message || '没有待生成的分镜图片')
        return
      }
      startProgressPolling(data.task_id, '批量生成分镜图片', data.total || ids.length)
    } catch {
      ElMessage.error('批量生成分镜图片失败')
    } finally {
      batchShotLoading.value = false
    }
  }
}

async function handleBatchShotPrompts() {
  if (!props.projectId || !shots.value.length) return
  enterSelectMode('prompt')
}

async function handleBatchCharImages() {
  if (!props.projectId) return
  batchCharLoading.value = true
  try {
    const data: any = await batchGenerateCharacterImages(props.projectId)
    if (!data.task_id) {
      ElMessage.info(data.message || '没有需要生成的人物图片')
      return
    }
    startProgressPolling(data.task_id, '批量生成人物图片', data.total || characters.value.length)
  } catch {
    ElMessage.error('批量生成人物图片失败')
  } finally {
    batchCharLoading.value = false
  }
}

async function handleBatchShotImages() {
  if (!props.projectId || !shots.value.length) return
  enterSelectMode('image')
}

async function handleSaveShot() {
  if (!selectedShot.value) return
  savingShot.value = true
  try {
    const { aspect_ratio, ...data } = editForm
    await updateShot(selectedShot.value.id, data)
    ElMessage.success('已保存')
    emit('refresh')
  } finally {
    savingShot.value = false
  }
}

async function handleRegenImage() {
  if (!selectedShot.value) return
  regenImage.value = true
  try {
    const data: any = await regenerateImage(selectedShot.value.id)
    if (data.task_id) {
      startProgressPolling(data.task_id, '重新生成图片', data.total || 1)
    } else {
      ElMessage.info(data.message || '无需重新生成')
    }
  } finally {
    regenImage.value = false
  }
}

async function handleRegenVideo() {
  if (!selectedShot.value) return
  regenVideo.value = true
  try {
    const data: any = await regenerateVideo(selectedShot.value.id)
    if (data.task_id) {
      startProgressPolling(data.task_id, '重新生成视频', data.total || 1)
    } else {
      ElMessage.info(data.message || '无需重新生成')
    }
  } finally {
    regenVideo.value = false
  }
}

function imageUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
  // data/uploads/xxx.png → /static/uploads/xxx.png
  const normalized = path.replace(/\\/g, '/')
  const servedPath = normalized.replace(/^data\//, '/static/')
  return `${base.replace(/\/api\/v1$/, '')}${servedPath}`
}

function previewImage(url: string) {
  previewImageUrl.value = url
  showImagePreview.value = true
}

function shotStatusType(shot: any) {
  if (shot.video_status === 'completed') return 'success'
  if (shot.video_status === 'failed') return 'danger'
  if (shot.video_status === 'processing') return 'warning'
  if (shot.image_status === 'completed') return ''
  if (shot.image_status === 'processing') return 'warning'
  if (shot.image_status === 'failed') return 'danger'
  return 'info'
}

function shotStatusLabel(shot: any) {
  if (shot.video_status === 'completed') return '视频完成'
  if (shot.video_status === 'processing') return '视频生成中'
  if (shot.video_status === 'failed') return '视频失败'
  if (shot.image_status === 'completed') return '图片完成'
  if (shot.image_status === 'processing') return '图片生成中'
  if (shot.image_status === 'failed') return '图片失败'
  return '待生成'
}
</script>

<style scoped lang="scss">
.batch-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

/* 人物参照区域 */
.character-section {
  margin-bottom: 8px;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.character-card {
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-card__body) {
    padding: 0;
  }

  .char-angles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 2px;
    height: 240px;
    background: var(--cyber-bg-input);
    cursor: pointer;
    overflow: hidden;

    .angle-cell {
      position: relative;
      overflow: hidden;
      background: var(--cyber-bg-card);

      .angle-img {
        width: 100%;
        height: 100%;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
          transform: scale(1.05);
        }
      }

      .angle-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        color: var(--cyber-text-dim);
        font-size: 11px;
      }
    }

    .char-image-single {
      grid-column: 1 / -1;
      grid-row: 1 / -1;

      .ref-img {
        width: 100%;
        height: 100%;
      }
    }

    .char-placeholder {
      grid-column: 1 / -1;
      grid-row: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;

      .placeholder-text {
        font-size: 12px;
        color: var(--cyber-text-dim);
      }
    }
  }

  .char-info {
    padding: 12px 12px 0;
    cursor: pointer;

    .char-name-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .char-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--cyber-text);
    }

    .char-tags {
      font-size: 12px;
      color: var(--cyber-text-dim);
      margin-bottom: 4px;
    }
  }
}

/* 通用卡片操作按钮 */
.card-actions {
  padding: 8px 12px 12px;
  display: flex;
  justify-content: center;
  gap: 8px;

  .el-button {
    flex: none;
    min-width: 80px;
  }
}

/* 场景参照区域 */
.scene-section {
  margin-top: 16px;
  margin-bottom: 8px;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.scene-card {
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-card__body) {
    padding: 0;
  }

  .scene-image {
    height: 160px;
    background: var(--cyber-bg-input);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    .scene-img {
      width: 100%;
      height: 100%;
    }

    .scene-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #909399;
    }
  }

  .scene-info {
    padding: 10px 12px 0;

    .scene-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--cyber-text);
    }

    .scene-meta {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }
}

/* 人物详情抽屉 */
.detail-angles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;

  .detail-angle-cell {
    text-align: center;
    cursor: pointer;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid var(--cyber-border);
    background: var(--cyber-bg-input);
    transition: border-color 0.2s;

    &:hover {
      border-color: var(--cyber-cyan);
    }

    .detail-angle-img {
      width: 100%;
      height: 180px;
    }

    .detail-angle-empty {
      width: 100%;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .detail-angle-label {
      display: block;
      font-size: 12px;
      color: var(--cyber-text-dim);
      padding: 4px 0;
      background: var(--cyber-bg-card);
    }
  }
}

.detail-preview-box,
.char-detail-image {
  width: 100%;
  height: 360px;
  background: var(--cyber-bg-input);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 16px;

  .detail-ref-img {
    width: 100%;
    height: 100%;
  }

  .detail-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    color: var(--cyber-text-dim);
    font-size: 14px;
  }
}

.detail-periods {
  margin-top: 20px;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }
}

/* 分镜卡片 */
.shot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.shot-card {
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: var(--el-color-primary);
  }

  &.selected {
    border-color: var(--el-color-success);
    background: #f0f9eb;
  }

  .shot-checkbox {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 1;
  }

  .shot-index {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }

  .shot-thumb {
    height: 120px;
    background: var(--cyber-bg-input);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-bottom: 8px;

    .thumb-img {
      width: 100%;
      height: 100%;
    }
  }

  .shot-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 6px;

    .shot-time {
      font-size: 12px;
      color: #909399;
    }
  }

  .shot-desc {
    font-size: 13px;
    color: #606266;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-bottom: 4px;
  }

  .shot-chars {
    margin-bottom: 8px;
  }

  .shot-status {
    text-align: right;
    margin-bottom: 4px;
  }
}

.char-angle-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.char-angle-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.char-angle-name {
  min-width: 60px;
  font-size: 14px;
  color: #303133;
}
</style>
