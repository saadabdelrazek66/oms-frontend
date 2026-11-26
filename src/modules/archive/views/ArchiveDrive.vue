<template>
  <div class="archive-drive-shell">
    <!-- Left Google-Drive Navigation Rail -->
    <aside class="drive-rail">
      <div class="rail-header">
        <div class="rail-brand">
          <span class="rail-brand-badge">🗄️</span>
          <div>
            <h2>الأرشيف المركزي</h2>
            <p>Archive Drive</p>
          </div>
        </div>

        <div v-if="can('archive.vault')" class="new-menu-wrapper">
          <button type="button" class="btn-drive-new" @click="showNewMenu = !showNewMenu">
            <span>＋</span>
            <span>جديد</span>
          </button>
          <div v-if="showNewMenu" class="new-dropdown" @mouseleave="showNewMenu = false">
            <button type="button" @click="openFolderModal()">
              <span>📁</span>
              <span>مجلد جديد</span>
            </button>
            <button type="button" @click="openExternalModal('file')">
              <span>📎</span>
              <span>أرشفة ملف خاص</span>
            </button>
            <button type="button" @click="openExternalModal('link')">
              <span>🔗</span>
              <span>حفظ رابط خارجي</span>
            </button>
            <button type="button" @click="openExternalModal('note')">
              <span>📝</span>
              <span>ملاحظة / سجل أرشيف</span>
            </button>
          </div>
        </div>
      </div>

      <div class="rail-section">
        <button
          type="button"
          class="rail-root-btn"
          :class="{ active: currentFolderId === null && !searchQuery }"
          @click="navigateRoot"
        >
          <span>🏠</span>
          <span>الأرشيف الرئيسي (My Drive)</span>
          <span class="count-pill">{{ stats.total_items || 0 }}</span>
        </button>
      </div>

      <div class="rail-section rail-tree-scroll">
        <div class="rail-section-title">أقسام النظام والمجلدات</div>
        <ArchiveFolderTreeNode
          v-for="node in folderTree"
          :key="node.id"
          :node="node"
          :selected-id="currentFolderId"
          @select="openFolderNode"
        />
      </div>

      <div class="rail-stats-card">
        <div class="stats-row">
          <span>المشاريع المؤرشفة</span>
          <strong>{{ stats.projects || 0 }}</strong>
        </div>
        <div class="stats-row">
          <span>خطط المحتوى</span>
          <strong>{{ stats.content_plans || 0 }}</strong>
        </div>
        <div class="stats-row">
          <span>جداول المنشورات</span>
          <strong>{{ stats.plan_posts || 0 }}</strong>
        </div>
        <div class="stats-row">
          <span>المهام السريعة</span>
          <strong>{{ stats.quick_tasks || 0 }}</strong>
        </div>
        <div class="stats-row">
          <span>خزنة المدير</span>
          <strong>{{ stats.external_items || 0 }}</strong>
        </div>
        <div class="auto-status-chip" :class="{ on: autoArchiveEnabled }">
          <span>{{ autoArchiveEnabled ? '🤖 الأرشفة التلقائية مفعّلة' : '⏸️ الأرشفة التلقائية متوقفة' }}</span>
        </div>
      </div>
    </aside>

    <!-- Main Drive Canvas -->
    <main class="drive-main">
      <!-- Top Search + Toolbar -->
      <header class="drive-topbar">
        <SearchInput
          v-model="searchInput"
          placeholder="ابحث داخل الأرشيف بالاسم، العميل، السبب، أو اسم الملف..."
          @search="onSearchCommit"
          @clear="clearSearch"
        />

        <div class="topbar-actions">
          <button
            v-if="can('archive.manage')"
            type="button"
            class="btn-glass btn-auto-run"
            :disabled="runningAuto"
            title="فحص وتشغيل الأرشفة التلقائية للعناصر المستوفية للشروط"
            @click="triggerAutoArchive"
          >
            <span>⚡</span>
            <span>{{ runningAuto ? 'جاري الفحص...' : 'تشغيل الأرشفة التلقائية' }}</span>
          </button>

          <div class="view-toggle">
            <button
              type="button"
              :class="{ active: viewMode === 'grid' }"
              title="عرض شبكي"
              @click="viewMode = 'grid'"
            >
              ⊞
            </button>
            <button
              type="button"
              :class="{ active: viewMode === 'list' }"
              title="عرض قائمة"
              @click="viewMode = 'list'"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <!-- Breadcrumbs + Filters -->
      <div class="drive-subbar">
        <nav class="breadcrumbs" aria-label="Breadcrumb">
          <button type="button" class="crumb-btn" @click="navigateRoot">
            <span>🗄️</span>
            <span>الأرشيف</span>
          </button>
          <template v-for="(crumb, idx) in breadcrumbs" :key="`${crumb.id}-${crumb.year || ''}-${crumb.month || ''}-${idx}`">
            <span class="crumb-sep">‹</span>
            <button
              type="button"
              class="crumb-btn"
              :class="{ current: idx === breadcrumbs.length - 1 }"
              @click="navigateCrumb(crumb)"
            >
              <span>{{ crumb.icon || '📁' }}</span>
              <span>{{ crumb.name }}</span>
            </button>
          </template>
          <span v-if="searchQuery" class="search-tag">
            نتائج البحث عن: "{{ searchQuery }}"
          </span>
        </nav>

        <div class="filters-row">
          <select v-model="filters.type" class="drive-select" @change="fetchBrowse">
            <option value="all">كل الأنواع</option>
            <option value="projects">📁 المشاريع</option>
            <option value="content_plans">🗓️ خطط المحتوى</option>
            <option value="plan_posts">📊 جداول المنشورات</option>
            <option value="quick_tasks">⚡ المهام السريعة</option>
            <option value="external_file">📎 ملفات مرفقة</option>
            <option value="external_link">🔗 روابط خارجية</option>
            <option value="external_note">📝 ملاحظات أرشيف</option>
          </select>

          <select v-model="filters.auto_filter" class="drive-select" @change="fetchBrowse">
            <option value="all">الكل (تلقائي + يدوي)</option>
            <option value="auto">🤖 تلقائي فقط</option>
            <option value="manual">✋ يدوي فقط</option>
          </select>

          <select v-model="filters.sort" class="drive-select" @change="fetchBrowse">
            <option value="newest">الأحدث أرشفة</option>
            <option value="oldest">الأقدم أرشفة</option>
            <option value="name">أبجدياً حسب الاسم</option>
          </select>
        </div>
      </div>

      <!-- Bulk Action Bar -->
      <div v-if="selectedUids.length > 0" class="bulk-bar">
        <div class="bulk-info">
          <span class="bulk-count">{{ selectedUids.length }}</span>
          <span>عنصر محدد</span>
        </div>
        <div class="bulk-btns">
          <button
            v-if="can('archive.manage') && selectedSystemItems.length > 0"
            type="button"
            class="btn-bulk restore"
            @click="bulkRestore"
          >
            ♻️ استعادة للنظام ({{ selectedSystemItems.length }})
          </button>
          <button
            v-if="can('archive.manage')"
            type="button"
            class="btn-bulk move"
            @click="openMoveModal(selectedItemsObjects)"
          >
            📂 نقل إلى مجلد...
          </button>
          <button type="button" class="btn-bulk cancel" @click="clearSelection">
            إلغاء التحديد
          </button>
        </div>
      </div>

      <!-- Content Scroll Area -->
      <div class="drive-content">
        <div v-if="loading" class="drive-loading">
          <div class="loader-ring"></div>
          <p>جاري تحميل الأرشيف...</p>
        </div>

        <template v-else>
          <!-- Real Folders + Virtual Year/Month Folders -->
          <section v-if="folders.length > 0 || virtualFolders.length > 0" class="drive-section">
            <div class="section-heading">المجلدات</div>

            <div class="folders-grid">
              <!-- Real Folders -->
              <div
                v-for="folder in folders"
                :key="`f-${folder.id}`"
                class="folder-card"
                :style="{ '--folder-accent': folder.color || '#38bdf8' }"
                @click="openFolder(folder)"
              >
                <div class="folder-card-top">
                  <span class="folder-icon">{{ folder.icon || '📁' }}</span>
                  <div v-if="!folder.is_system && can('archive.vault')" class="folder-card-actions" @click.stop>
                    <button type="button" title="تعديل المجلد" @click="openFolderModal(folder)">✏️</button>
                    <button type="button" title="حذف المجلد" @click="confirmDeleteFolder(folder)">🗑️</button>
                  </div>
                  <span v-else-if="folder.is_system" class="sys-pill">قسم نظام</span>
                </div>
                <div class="folder-name">{{ folder.name }}</div>
                <div class="folder-meta">{{ folder.items_count || 0 }} عنصر</div>
              </div>

              <!-- Virtual Auto Year/Month Folders -->
              <div
                v-for="vf in virtualFolders"
                :key="`vf-${vf.year}-${vf.month || 'all'}`"
                class="folder-card virtual"
                @click="openVirtualFolder(vf)"
              >
                <div class="folder-card-top">
                  <span class="folder-icon">{{ vf.icon }}</span>
                  <span class="sys-pill virtual-pill">{{ vf.kind === 'year' ? 'سنة' : 'شهر' }}</span>
                </div>
                <div class="folder-name">{{ vf.name }}</div>
                <div class="folder-meta">{{ vf.items_count }} عنصر</div>
              </div>
            </div>
          </section>

          <!-- Files & Archived System Records -->
          <section v-if="items.length > 0" class="drive-section">
            <div class="section-heading">
              <span>العناصر المؤرشفة ({{ items.length }})</span>
              <button
                v-if="can('archive.manage')"
                type="button"
                class="select-all-link"
                @click="toggleSelectAll"
              >
                {{ selectedUids.length === items.length ? 'إلغاء تحديد الكل' : 'تحديد الكل' }}
              </button>
            </div>

            <!-- Grid View -->
            <div v-if="viewMode === 'grid'" class="items-grid">
              <div
                v-for="item in items"
                :key="item.uid"
                class="item-card"
                :class="{ selected: isSelected(item.uid), inspected: inspectedItem?.uid === item.uid }"
                @click="inspectItem(item)"
              >
                <div class="item-card-head">
                  <label v-if="can('archive.manage')" class="chk-wrap" @click.stop>
                    <input
                      type="checkbox"
                      :checked="isSelected(item.uid)"
                      @change="toggleSelect(item.uid)"
                    />
                  </label>
                  <span class="type-badge" :class="`type-${item.item_type}`">
                    {{ getItemIcon(item) }} {{ item.item_label }}
                  </span>
                  <span class="origin-badge" :class="{ auto: item.is_auto_archived }">
                    {{ item.item_kind === 'external' ? 'خزنة' : (item.is_auto_archived ? '🤖 تلقائي' : '✋ يدوي') }}
                  </span>
                </div>

                <h4 class="item-title" :title="item.title">{{ item.title }}</h4>
                <p class="item-subtitle">{{ item.subtitle || item.archive_reason || 'بدون تفاصيل إضافية' }}</p>

                <div class="item-card-foot">
                  <span class="date-label">{{ formatDateShort(item.archived_at) }}</span>
                  <div class="quick-btns" @click.stop>
                    <button
                      v-if="item.item_kind === 'external' && item.item_type === 'file'"
                      type="button"
                      title="تنزيل الملف"
                      @click="downloadItem(item)"
                    >
                      ⬇️
                    </button>
                    <button
                      v-if="item.item_kind === 'external' && item.item_type === 'link'"
                      type="button"
                      title="فتح الرابط"
                      @click="openExternalLink(item.meta?.external_url)"
                    >
                      ↗️
                    </button>
                    <button
                      v-if="item.item_kind === 'system' && can('archive.manage')"
                      type="button"
                      title="استعادة للنظام"
                      @click="restoreSingle(item)"
                    >
                      ♻️
                    </button>
                    <button
                      v-if="can('archive.manage')"
                      type="button"
                      title="نقل لمجلد آخر"
                      @click="openMoveModal([item])"
                    >
                      📂
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- List View -->
            <div v-else class="items-table-wrap">
              <table class="items-table">
                <thead>
                  <tr>
                    <th v-if="can('archive.manage')" style="width: 38px;">
                      <input
                        type="checkbox"
                        :checked="items.length > 0 && selectedUids.length === items.length"
                        @change="toggleSelectAll"
                      />
                    </th>
                    <th>العنصر</th>
                    <th>النوع</th>
                    <th>المصدر</th>
                    <th>تاريخ الأرشفة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in items"
                    :key="item.uid"
                    :class="{ selected: isSelected(item.uid), inspected: inspectedItem?.uid === item.uid }"
                    @click="inspectItem(item)"
                  >
                    <td v-if="can('archive.manage')" @click.stop>
                      <input
                        type="checkbox"
                        :checked="isSelected(item.uid)"
                        @change="toggleSelect(item.uid)"
                      />
                    </td>
                    <td>
                      <div class="list-title-cell">
                        <span class="list-icon">{{ getItemIcon(item) }}</span>
                        <div>
                          <div class="list-title">{{ item.title }}</div>
                          <div class="list-sub">{{ item.subtitle || item.archive_reason }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="type-badge" :class="`type-${item.item_type}`">{{ item.item_label }}</span>
                    </td>
                    <td>
                      <span class="origin-badge" :class="{ auto: item.is_auto_archived }">
                        {{ item.item_kind === 'external' ? 'خزنة المدير' : (item.is_auto_archived ? '🤖 تلقائي' : '✋ يدوي') }}
                      </span>
                    </td>
                    <td class="mono-cell">{{ formatDateShort(item.archived_at) }}</td>
                    <td @click.stop>
                      <div class="table-actions">
                        <button
                          v-if="item.item_kind === 'external' && item.item_type === 'file'"
                          type="button"
                          class="tbl-btn"
                          title="تنزيل"
                          @click="downloadItem(item)"
                        >
                          ⬇️
                        </button>
                        <button
                          v-if="item.item_kind === 'system' && can('archive.manage')"
                          type="button"
                          class="tbl-btn restore"
                          title="استعادة"
                          @click="restoreSingle(item)"
                        >
                          ♻️
                        </button>
                        <button
                          v-if="can('archive.manage')"
                          type="button"
                          class="tbl-btn"
                          title="نقل"
                          @click="openMoveModal([item])"
                        >
                          📂
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- Empty State -->
          <div v-if="folders.length === 0 && virtualFolders.length === 0 && items.length === 0" class="drive-empty">
            <div class="empty-emoji">🗄️</div>
            <h3>لا توجد عناصر في هذا المجلد حالياً</h3>
            <p>
              {{
                searchQuery
                  ? 'جرّب تغيير كلمات البحث أو إزالة الفلاتر للعثور على عناصر أخرى.'
                  : 'تصل العناصر المكتملة إلى هنا تلقائياً عند انتهاء مهلتها، أو يمكنك أرشفة ملفاتك ومجلداتك الخاصة يدوياً.'
              }}
            </p>
            <button v-if="currentFolderId !== null" type="button" class="btn-glass" @click="navigateRoot">
              العودة للأرشيف الرئيسي
            </button>
          </div>
        </template>
      </div>
    </main>

    <!-- Right Inspector Drawer -->
    <aside v-if="inspectedItem" class="inspector-drawer">
      <div class="inspector-head">
        <div class="inspector-title-group">
          <span class="inspector-icon">{{ getItemIcon(inspectedItem) }}</span>
          <div>
            <span class="type-badge" :class="`type-${inspectedItem.item_type}`">{{ inspectedItem.item_label }}</span>
            <h3>{{ inspectedItem.title }}</h3>
          </div>
        </div>
        <button type="button" class="close-inspector" @click="inspectedItem = null">✕</button>
      </div>

      <div class="inspector-body">
        <div v-if="inspectedItem.subtitle" class="meta-block">
          <label>التفاصيل</label>
          <p>{{ inspectedItem.subtitle }}</p>
        </div>

        <div class="meta-grid">
          <div class="meta-cell">
            <label>طريقة الأرشفة</label>
            <span>{{ inspectedItem.item_kind === 'external' ? 'خزنة المدير' : (inspectedItem.is_auto_archived ? '🤖 تلقائية' : '✋ يدوية') }}</span>
          </div>
          <div class="meta-cell">
            <label>الحالة</label>
            <span>{{ inspectedItem.status_label || 'مؤرشف' }}</span>
          </div>
          <div class="meta-cell">
            <label>تاريخ الأرشفة</label>
            <span>{{ formatDateTime(inspectedItem.archived_at) }}</span>
          </div>
          <div class="meta-cell">
            <label>التاريخ المرجعي</label>
            <span>{{ inspectedItem.reference_date || '—' }}</span>
          </div>
          <div v-if="inspectedItem.archived_by_name" class="meta-cell">
            <label>بواسطة</label>
            <span>{{ inspectedItem.archived_by_name }}</span>
          </div>
          <div v-if="inspectedItem.folder_name" class="meta-cell">
            <label>المجلد الحالي</label>
            <span>{{ inspectedItem.folder_name }}</span>
          </div>
        </div>

        <div v-if="inspectedItem.archive_reason" class="meta-block">
          <label>{{ inspectedItem.item_kind === 'external' ? 'الوصف / الملاحظة' : 'سبب الأرشفة' }}</label>
          <p class="note-box">{{ inspectedItem.archive_reason }}</p>
        </div>

        <div v-if="inspectedItem.meta?.file_name" class="meta-block">
          <label>بيانات الملف</label>
          <div class="file-chip">
            <span>📎 {{ inspectedItem.meta.file_name }}</span>
            <small>{{ formatBytes(inspectedItem.meta.file_size) }}</small>
          </div>
        </div>

        <div v-if="inspectedItem.meta?.tags?.length" class="meta-block">
          <label>الوسوم</label>
          <div class="tags-wrap">
            <span v-for="tag in inspectedItem.meta.tags" :key="tag" class="tag-pill">#{{ tag }}</span>
          </div>
        </div>
      </div>

      <div class="inspector-actions">
        <button
          v-if="inspectedItem.item_kind === 'system' && inspectedItem.meta?.open_route"
          type="button"
          class="btn-action primary"
          @click="router.push(inspectedItem.meta.open_route)"
        >
          🔗 عرض في الصفحة الأصلية
        </button>

        <button
          v-if="inspectedItem.meta?.final_link"
          type="button"
          class="btn-action secondary"
          @click="openExternalLink(inspectedItem.meta.final_link)"
        >
          ☁️ فتح رابط التسليم النهائي
        </button>

        <template v-if="inspectedItem.item_kind === 'external' && inspectedItem.item_type === 'file'">
          <button type="button" class="btn-action primary" @click="downloadItem(inspectedItem, false)">
            ⬇️ تنزيل الملف
          </button>
          <button
            v-if="isPreviewableMime(inspectedItem.meta?.mime_type)"
            type="button"
            class="btn-action secondary"
            @click="downloadItem(inspectedItem, true)"
          >
            👁️ معاينة مباشرة
          </button>
        </template>

        <button
          v-if="inspectedItem.item_kind === 'external' && inspectedItem.item_type === 'link'"
          type="button"
          class="btn-action primary"
          @click="openExternalLink(inspectedItem.meta?.external_url)"
        >
          ↗️ فتح الرابط الخارجي
        </button>

        <button
          v-if="can('archive.manage')"
          type="button"
          class="btn-action secondary"
          @click="openMoveModal([inspectedItem])"
        >
          📂 نقل إلى مجلد آخر
        </button>

        <button
          v-if="inspectedItem.item_kind === 'system' && can('archive.manage')"
          type="button"
          class="btn-action restore"
          @click="restoreSingle(inspectedItem)"
        >
          ♻️ استعادة إلى الشاشة التشغيلية
        </button>

        <button
          v-if="inspectedItem.item_kind === 'external' && can('archive.vault')"
          type="button"
          class="btn-action danger"
          @click="confirmDeleteExternal(inspectedItem)"
        >
          🗑️ حذف العنصر نهائياً
        </button>
      </div>
    </aside>

    <!-- Modal 1: Create / Edit Custom Folder -->
    <BaseModal
      v-model="folderModal.open"
      :title="folderModal.editingId ? 'تعديل المجلد' : 'إنشاء مجلد جديد في الأرشيف'"
      max-width="480px"
    >
      <form @submit.prevent="submitFolderModal">
        <div class="form-group">
          <label>اسم المجلد *</label>
          <input v-model="folderModal.name" type="text" required maxlength="120" placeholder="مثال: عقود العملاء 2026" />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>الأيقونة</label>
            <div class="emoji-choices">
              <button
                v-for="ico in ['📁', '🔐', '💼', '🧾', '🎨', '📑', '🏆', '📦']"
                :key="ico"
                type="button"
                :class="{ active: folderModal.icon === ico }"
                @click="folderModal.icon = ico"
              >
                {{ ico }}
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>لون المجلد</label>
            <div class="color-choices">
              <button
                v-for="clr in ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6']"
                :key="clr"
                type="button"
                class="color-dot"
                :style="{ background: clr }"
                :class="{ active: folderModal.color === clr }"
                @click="folderModal.color = clr"
              ></button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>وصف مختصر (اختياري)</label>
          <textarea v-model="folderModal.description" rows="2" placeholder="ما الذي يُحفظ داخل هذا المجلد؟"></textarea>
        </div>

        <div class="modal-foot">
          <button type="button" class="btn-glass" @click="folderModal.open = false">إلغاء</button>
          <button type="submit" class="btn-drive-new" :disabled="savingModal">
            {{ savingModal ? 'جاري الحفظ...' : (folderModal.editingId ? 'حفظ التعديلات' : 'إنشاء المجلد') }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Modal 2: Create External Vault Item -->
    <BaseModal
      v-model="externalModal.open"
      title="أرشفة عنصر خاص في خزنة الأرشيف"
      max-width="480px"
    >
      <div class="type-tabs" style="margin-bottom: 12px;">
        <button
          type="button"
          :class="{ active: externalModal.item_type === 'file' }"
          @click="externalModal.item_type = 'file'"
        >
          📎 ملف مرفق
        </button>
        <button
          type="button"
          :class="{ active: externalModal.item_type === 'link' }"
          @click="externalModal.item_type = 'link'"
        >
          🔗 رابط خارجي
        </button>
        <button
          type="button"
          :class="{ active: externalModal.item_type === 'note' }"
          @click="externalModal.item_type = 'note'"
        >
          📝 ملاحظة / سجل
        </button>
      </div>

      <form @submit.prevent="submitExternalModal">
        <div class="form-group">
          <label>العنوان *</label>
          <input v-model="externalModal.title" type="text" required maxlength="200" placeholder="اسم المستند أو المرجع..." />
        </div>

        <div v-if="externalModal.item_type === 'file'" class="form-group">
          <label>اختر الملف (الحد الأقصى 25MB) *</label>
          <input type="file" class="file-input" @change="onExternalFileChange" />
          <small v-if="externalModal.file" class="file-picked">{{ externalModal.file.name }}</small>
        </div>

        <div v-if="externalModal.item_type === 'link'" class="form-group">
          <label>الرابط الخارجي (https://...) *</label>
          <input v-model="externalModal.external_url" type="url" required placeholder="https://drive.google.com/..." />
        </div>

        <div class="form-row-2">
          <div class="form-group">
            <label>التاريخ المرجعي</label>
            <input v-model="externalModal.reference_date" type="date" />
          </div>
          <div class="form-group">
            <label>الوسوم (افصل بفاصلة)</label>
            <input v-model="externalModal.tagsText" type="text" placeholder="عقود, عميل مهم, 2026" />
          </div>
        </div>

        <div class="form-group">
          <label>{{ externalModal.item_type === 'note' ? 'محتوى الملاحظة / السجل *' : 'وصف إضافي (اختياري)' }}</label>
          <textarea
            v-model="externalModal.description"
            :required="externalModal.item_type === 'note'"
            rows="3"
            placeholder="اكتب التفاصيل أو الملاحظات هنا..."
          ></textarea>
        </div>

        <div class="modal-foot">
          <button type="button" class="btn-glass" @click="externalModal.open = false">إلغاء</button>
          <button type="submit" class="btn-drive-new" :disabled="savingModal">
            {{ savingModal ? 'جاري الرفع والحفظ...' : 'حفظ في الأرشيف' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Modal 3: Move-To Folder Picker -->
    <BaseModal
      v-model="moveModal.open"
      :title="`نقل (${moveModal.items.length}) عنصر إلى مجلد`"
      max-width="480px"
    >
      <div class="move-tree-box">
        <button
          type="button"
          class="rail-root-btn"
          :class="{ active: moveModal.targetFolderId === null }"
          @click="moveModal.targetFolderId = null"
        >
          <span>🏠</span>
          <span>المجلد الافتراضي / الرئيسي</span>
        </button>
        <ArchiveFolderTreeNode
          v-for="node in folderTree"
          :key="`mv-${node.id}`"
          :node="node"
          :selected-id="moveModal.targetFolderId"
          @select="moveModal.targetFolderId = $event.id"
        />
      </div>

      <template #footer>
        <button type="button" class="btn-glass" @click="moveModal.open = false">إلغاء</button>
        <button type="button" class="btn-drive-new" :disabled="savingModal" @click="confirmMoveItems">
          {{ savingModal ? 'جاري النقل...' : 'تأكيد النقل' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import archiveApi from '../api/archiveApi';
import ArchiveFolderTreeNode from '../components/ArchiveFolderTreeNode.vue';
import BaseModal from '@/components/ui/BaseModal.vue';
import SearchInput from '@/components/ui/SearchInput.vue';
import { usePermissions } from '@/composables/usePermissions';
import { useAlert } from '@/composables/useAlert';
import { formatDate as formatDateShort, formatDateTime, formatBytes } from '@/utils/formatters';
import { openExternalUrl } from '@/utils/driveValidation';

const router = useRouter();
const route = useRoute();
const { can } = usePermissions();
const { confirm, success, error, info } = useAlert();

const loading = ref(true);
const runningAuto = ref(false);
const savingModal = ref(false);
const showNewMenu = ref(false);
const viewMode = ref('grid');

const stats = ref({});
const autoArchiveEnabled = ref(true);
const folderTree = ref([]);

const currentFolderId = ref(null);
const currentYear = ref(null);
const currentMonth = ref(null);
const breadcrumbs = ref([]);
const folders = ref([]);
const virtualFolders = ref([]);
const items = ref([]);
const inspectedItem = ref(null);

const searchInput = ref('');
const searchQuery = ref('');

function onSearchCommit(term) {
  searchQuery.value = term;
  fetchBrowse();
}

const filters = reactive({
  type: 'all',
  auto_filter: 'all',
  sort: 'newest',
});

const selectedUids = ref([]);

const selectedItemsObjects = computed(() =>
  items.value.filter((i) => selectedUids.value.includes(i.uid))
);
const selectedSystemItems = computed(() =>
  selectedItemsObjects.value.filter((i) => i.item_kind === 'system')
);

const folderModal = reactive({
  open: false,
  editingId: null,
  parentId: null,
  name: '',
  icon: '📁',
  color: '#6366f1',
  description: '',
});

const externalModal = reactive({
  open: false,
  item_type: 'file',
  title: '',
  external_url: '',
  description: '',
  reference_date: new Date().toISOString().slice(0, 10),
  tagsText: '',
  file: null,
});

const moveModal = reactive({
  open: false,
  targetFolderId: null,
  items: [],
});

async function refreshMeta() {
  try {
    const [statsRes, treeRes] = await Promise.all([
      archiveApi.getStats(),
      archiveApi.getTree(),
    ]);
    stats.value = statsRes.data?.counts || {};
    autoArchiveEnabled.value = Boolean(statsRes.data?.auto_archive_enabled ?? true);
    folderTree.value = treeRes.data?.tree || [];
  } catch (err) {
    // Non-blocking meta refresh
  }
}

async function fetchBrowse() {
  loading.value = true;
  selectedUids.value = [];
  try {
    const params = {
      type: filters.type,
      auto_filter: filters.auto_filter,
      sort: filters.sort,
    };
    if (currentFolderId.value !== null) params.folder_id = currentFolderId.value;
    if (currentYear.value !== null) params.year = currentYear.value;
    if (currentMonth.value !== null) params.month = currentMonth.value;
    if (searchQuery.value) params.search = searchQuery.value;

    const { data } = await archiveApi.browse(params);
    breadcrumbs.value = data.breadcrumbs || [];
    folders.value = data.folders || [];
    virtualFolders.value = data.virtual_folders || [];
    items.value = data.items || [];

    if (inspectedItem.value) {
      const updated = items.value.find((i) => i.uid === inspectedItem.value.uid);
      inspectedItem.value = updated || null;
    }
  } catch (err) {
    error(err?.response?.data?.message || 'تعذر تحميل بيانات الأرشيف');
  } finally {
    loading.value = false;
  }
}

function navigateRoot() {
  currentFolderId.value = null;
  currentYear.value = null;
  currentMonth.value = null;
  searchInput.value = '';
  searchQuery.value = '';
  inspectedItem.value = null;
  fetchBrowse();
}

function openFolder(folder) {
  currentFolderId.value = folder.id;
  currentYear.value = null;
  currentMonth.value = null;
  searchInput.value = '';
  searchQuery.value = '';
  inspectedItem.value = null;
  fetchBrowse();
}

function openFolderNode(node) {
  openFolder(node);
}

function openVirtualFolder(vf) {
  currentYear.value = vf.year;
  currentMonth.value = vf.month ?? null;
  inspectedItem.value = null;
  fetchBrowse();
}

function navigateCrumb(crumb) {
  currentFolderId.value = crumb.id;
  currentYear.value = crumb.year ?? null;
  currentMonth.value = crumb.month ?? null;
  fetchBrowse();
}

function clearSearch() {
  searchInput.value = '';
  searchQuery.value = '';
  fetchBrowse();
}

function isSelected(uid) {
  return selectedUids.value.includes(uid);
}

function toggleSelect(uid) {
  if (isSelected(uid)) {
    selectedUids.value = selectedUids.value.filter((x) => x !== uid);
  } else {
    selectedUids.value.push(uid);
  }
}

function toggleSelectAll() {
  if (selectedUids.value.length === items.value.length) {
    selectedUids.value = [];
  } else {
    selectedUids.value = items.value.map((i) => i.uid);
  }
}

function clearSelection() {
  selectedUids.value = [];
}

function inspectItem(item) {
  inspectedItem.value = item;
}

function openFolderModal(editingFolder = null) {
  showNewMenu.value = false;
  if (editingFolder) {
    folderModal.editingId = editingFolder.id;
    folderModal.parentId = editingFolder.parent_id ?? null;
    folderModal.name = editingFolder.name;
    folderModal.icon = editingFolder.icon || '📁';
    folderModal.color = editingFolder.color || '#6366f1';
    folderModal.description = editingFolder.description || '';
  } else {
    folderModal.editingId = null;
    folderModal.parentId = currentFolderId.value;
    folderModal.name = '';
    folderModal.icon = '📁';
    folderModal.color = '#6366f1';
    folderModal.description = '';
  }
  folderModal.open = true;
}

async function submitFolderModal() {
  savingModal.value = true;
  try {
    const payload = {
      name: folderModal.name.trim(),
      icon: folderModal.icon,
      color: folderModal.color,
      description: folderModal.description?.trim() || null,
    };
    if (folderModal.editingId) {
      await archiveApi.updateFolder(folderModal.editingId, payload);
      success('تم تحديث المجلد بنجاح');
    } else {
      payload.parent_id = folderModal.parentId;
      await archiveApi.createFolder(payload);
      success('تم إنشاء المجلد بنجاح');
    }
    folderModal.open = false;
    await Promise.all([refreshMeta(), fetchBrowse()]);
  } catch (err) {
    error(err?.response?.data?.message || 'تعذر حفظ المجلد');
  } finally {
    savingModal.value = false;
  }
}

async function confirmDeleteFolder(folder) {
  const ok = await confirm({
    title: 'حذف مجلد من الأرشيف',
    message: `هل تريد حذف المجلد "${folder.name}"؟ يجب أن يكون خالياً من الملفات الخارجية والمجلدات الفرعية.`,
    type: 'danger',
    confirmText: 'نعم، حذف',
    cancelText: 'إلغاء',
  });
  if (!ok) return;

  try {
    await archiveApi.deleteFolder(folder.id);
    success('تم حذف المجلد');
    await Promise.all([refreshMeta(), fetchBrowse()]);
  } catch (err) {
    error(err?.response?.data?.message || 'تعذر حذف المجلد');
  }
}

function openExternalModal(mode = 'file') {
  showNewMenu.value = false;
  externalModal.item_type = mode;
  externalModal.title = '';
  externalModal.external_url = '';
  externalModal.description = '';
  externalModal.reference_date = new Date().toISOString().slice(0, 10);
  externalModal.tagsText = '';
  externalModal.file = null;
  externalModal.open = true;
}

function onExternalFileChange(event) {
  const file = event.target?.files?.[0] || null;
  externalModal.file = file;
  if (file && !externalModal.title) {
    externalModal.title = file.name.replace(/\.[^/.]+$/, '');
  }
}

async function submitExternalModal() {
  if (externalModal.item_type === 'file' && !externalModal.file) {
    error('يرجى اختيار الملف المراد أرشفته أولاً.');
    return;
  }

  savingModal.value = true;
  try {
    const fd = new FormData();
    fd.append('item_type', externalModal.item_type);
    fd.append('title', externalModal.title.trim());
    if (currentFolderId.value !== null) {
      fd.append('folder_id', String(currentFolderId.value));
    }
    if (externalModal.description?.trim()) {
      fd.append('description', externalModal.description.trim());
    }
    if (externalModal.reference_date) {
      fd.append('reference_date', externalModal.reference_date);
    }
    const tags = externalModal.tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    tags.forEach((tag, idx) => fd.append(`tags[${idx}]`, tag));

    if (externalModal.item_type === 'file' && externalModal.file) {
      fd.append('file', externalModal.file);
    } else if (externalModal.item_type === 'link') {
      fd.append('external_url', externalModal.external_url.trim());
    }

    await archiveApi.createExternalItem(fd);
    success('تم حفظ العنصر في خزنة الأرشيف');
    externalModal.open = false;
    await Promise.all([refreshMeta(), fetchBrowse()]);
  } catch (err) {
    error(err?.response?.data?.message || 'تعذر حفظ العنصر');
  } finally {
    savingModal.value = false;
  }
}

async function downloadItem(item, inline = false) {
  try {
    await archiveApi.downloadExternalItem(item.id, item.meta?.file_name || item.title, inline);
  } catch (err) {
    error(err?.response?.data?.message || 'تعذر تحميل الملف');
  }
}

function openExternalLink(url) {
  openExternalUrl(url);
}

async function restoreSingle(item) {
  const ok = await confirm({
    title: 'استعادة من الأرشيف',
    message: `هل تريد استعادة "${item.title}" وإعادته إلى شاشته التشغيلية النشطة؟`,
    type: 'info',
    confirmText: 'استعادة',
    cancelText: 'إلغاء',
  });
  if (!ok) return;

  try {
    await archiveApi.restoreItems({ module_key: item.module_key, id: item.id });
    success('تمت استعادة العنصر إلى النظام النشط');
    inspectedItem.value = null;
    await Promise.all([refreshMeta(), fetchBrowse()]);
  } catch (err) {
    error(err?.response?.data?.message || 'تعذر الاستعادة');
  }
}

async function bulkRestore() {
  const targets = selectedSystemItems.value.map((i) => ({ module_key: i.module_key, id: i.id }));
  if (targets.length === 0) return;

  const ok = await confirm({
    title: 'استعادة جماعية',
    message: `سيتم استعادة ${targets.length} عنصر إلى صفحاتها النشطة. هل تود المتابعة؟`,
    type: 'info',
    confirmText: 'نعم، استعادة الكل',
    cancelText: 'إلغاء',
  });
  if (!ok) return;

  try {
    const { data } = await archiveApi.restoreItems({ items: targets });
    success(data.message || 'تمت الاستعادة بنجاح');
    selectedUids.value = [];
    inspectedItem.value = null;
    await Promise.all([refreshMeta(), fetchBrowse()]);
  } catch (err) {
    error(err?.response?.data?.message || 'تعذر الاستعادة الجماعية');
  }
}

function openMoveModal(itemsToMove) {
  moveModal.items = itemsToMove;
  moveModal.targetFolderId = currentFolderId.value;
  moveModal.open = true;
}

async function confirmMoveItems() {
  if (!moveModal.items.length) return;
  savingModal.value = true;
  try {
    const payload = {
      folder_id: moveModal.targetFolderId,
      items: moveModal.items.map((i) => ({
        module_key: i.module_key,
        id: i.id,
      })),
    };
    const { data } = await archiveApi.moveItems(payload);
    success(data.message || 'تم النقل بنجاح');
    moveModal.open = false;
    selectedUids.value = [];
    await Promise.all([refreshMeta(), fetchBrowse()]);
  } catch (err) {
    error(err?.response?.data?.message || 'تعذر نقل العناصر');
  } finally {
    savingModal.value = false;
  }
}

async function confirmDeleteExternal(item) {
  const ok = await confirm({
    title: 'حذف عنصر من الخزنة',
    message: `سيتم حذف "${item.title}" نهائياً من الأرشيف. هل أنت متأكد؟`,
    type: 'danger',
    confirmText: 'حذف نهائي',
    cancelText: 'إلغاء',
  });
  if (!ok) return;

  try {
    await archiveApi.deleteExternalItem(item.id);
    success('تم الحذف بنجاح');
    inspectedItem.value = null;
    await Promise.all([refreshMeta(), fetchBrowse()]);
  } catch (err) {
    error(err?.response?.data?.message || 'تعذر الحذف');
  }
}

async function triggerAutoArchive() {
  runningAuto.value = true;
  try {
    const previewRes = await archiveApi.runAutoArchive({ dry_run: true, force: true });
    const preview = previewRes.data?.result;
    if (!preview || preview.total === 0) {
      info('لا توجد عناصر مستوفية لشروط الأرشفة التلقائية حالياً.');
      return;
    }

    const counts = preview.counts || {};
    const ok = await confirm({
      title: `معاينة الأرشفة التلقائية (${preview.total} عنصر)`,
      message: `مشاريع: ${counts.projects || 0} | خطط محتوى: ${counts.content_plans || 0} | منشورات: ${counts.plan_posts || 0} | مهام سريعة: ${counts.quick_tasks || 0}. هل تريد تنفيذ الأرشفة الآن؟`,
      type: 'warning',
      confirmText: 'تنفيذ الأرشفة الآن',
      cancelText: 'إلغاء',
    });
    if (!ok) return;

    const execRes = await archiveApi.runAutoArchive({ dry_run: false, force: true });
    success(execRes.data?.message || 'تم تنفيذ الأرشفة التلقائية');
    await Promise.all([refreshMeta(), fetchBrowse()]);
  } catch (err) {
    error(err?.response?.data?.message || 'تعذر تشغيل الأرشفة التلقائية');
  } finally {
    runningAuto.value = false;
  }
}

function getItemIcon(item) {
  switch (item.item_type) {
    case 'project': return '📁';
    case 'content_plan': return '🗓️';
    case 'plan_post': return '📊';
    case 'quick_task': return '⚡';
    case 'file': return '📎';
    case 'link': return '🔗';
    case 'note': return '📝';
    default: return '📄';
  }
}

function isPreviewableMime(mime) {
  if (!mime) return false;
  return mime.startsWith('image/') || mime === 'application/pdf' || mime.startsWith('audio/') || mime === 'video/mp4';
}

onMounted(async () => {
  await refreshMeta();
  const targetModule = route.query.module ? String(route.query.module) : null;
  if (targetModule) {
    const matched = folderTree.value.find((f) => f.module_key === targetModule);
    if (matched) {
      currentFolderId.value = matched.id;
    }
  }
  await fetchBrowse();
});
</script>

<style scoped>
.archive-drive-shell {
  display: flex;
  gap: 16px;
  min-height: calc(100vh - 90px);
  color: #e2e8f0;
  direction: rtl;
}

/* Left Rail */
.drive-rail {
  width: 270px;
  flex-shrink: 0;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  backdrop-filter: blur(12px);
}

.rail-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rail-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rail-brand-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 1.3rem;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.25));
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.rail-brand h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
}

.rail-brand p {
  margin: 0;
  font-size: 0.75rem;
  color: #94a3b8;
}

.new-menu-wrapper {
  position: relative;
}

.btn-drive-new {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: linear-gradient(135deg, #0284c7, #4f46e5);
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-drive-new:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(56, 189, 248, 0.24);
}

.new-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  z-index: 30;
  background: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.new-dropdown button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #e2e8f0;
  font-size: 0.85rem;
  cursor: pointer;
  text-align: right;
}

.new-dropdown button:hover {
  background: rgba(56, 189, 248, 0.15);
}

.rail-root-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  border-radius: 10px;
  background: rgba(30, 41, 59, 0.55);
  color: #cbd5e1;
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 600;
}

.rail-root-btn.active {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.22));
  color: #f0f9ff;
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.4);
}

.count-pill {
  margin-right: auto;
  background: rgba(56, 189, 248, 0.2);
  color: #7dd3fc;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
}

.rail-section-title {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 700;
  margin-bottom: 6px;
  padding: 0 6px;
}

.rail-tree-scroll {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}

.rail-stats-card {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
}

.stats-row strong {
  color: #f1f5f9;
}

.auto-status-chip {
  margin-top: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  text-align: center;
  font-size: 0.75rem;
  background: rgba(148, 163, 184, 0.12);
  color: #cbd5e1;
}

.auto-status-chip.on {
  background: rgba(16, 185, 129, 0.14);
  color: #6ee7b7;
}

/* Main Workspace */
.drive-main {
  flex: 1;
  min-width: 0;
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  backdrop-filter: blur(12px);
}

.drive-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 240px;
  display: flex;
  align-items: center;
  background: rgba(30, 41, 59, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 0 12px;
}

.search-box input {
  width: 100%;
  border: none;
  background: transparent;
  color: #f8fafc;
  padding: 10px 8px;
  font-size: 0.9rem;
  outline: none;
}

.clear-search {
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-glass {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 13px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.7);
  color: #e2e8f0;
  font-size: 0.84rem;
  cursor: pointer;
}

.btn-glass:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.16);
  border-color: rgba(56, 189, 248, 0.4);
}

.view-toggle {
  display: inline-flex;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  overflow: hidden;
}

.view-toggle button {
  border: none;
  background: transparent;
  color: #94a3b8;
  padding: 7px 11px;
  cursor: pointer;
  font-size: 1rem;
}

.view-toggle button.active {
  background: rgba(56, 189, 248, 0.22);
  color: #7dd3fc;
}

.drive-subbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.crumb-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: rgba(30, 41, 59, 0.55);
  color: #cbd5e1;
  padding: 5px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.84rem;
}

.crumb-btn.current {
  background: rgba(56, 189, 248, 0.18);
  color: #bae6fd;
  font-weight: 600;
}

.crumb-sep {
  color: #64748b;
  font-weight: 700;
}

.search-tag {
  font-size: 0.8rem;
  color: #38bdf8;
  padding-right: 6px;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.drive-select {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.22);
  color: #e2e8f0;
  border-radius: 9px;
  padding: 6px 10px;
  font-size: 0.82rem;
}

/* Bulk Bar */
.bulk-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 12px;
  padding: 9px 14px;
}

.bulk-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.bulk-count {
  background: #0284c7;
  color: #fff;
  border-radius: 999px;
  padding: 1px 9px;
  font-size: 0.8rem;
}

.bulk-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-bulk {
  border: none;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.82rem;
  cursor: pointer;
  color: #fff;
}

.btn-bulk.restore { background: #059669; }
.btn-bulk.move { background: #4f46e5; }
.btn-bulk.cancel { background: rgba(148, 163, 184, 0.25); }

/* Folders & Items */
.drive-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 10px;
}

.select-all-link {
  border: none;
  background: transparent;
  color: #38bdf8;
  cursor: pointer;
  font-size: 0.82rem;
}

.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
}

.folder-card {
  background: rgba(30, 41, 59, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-top: 3px solid var(--folder-accent, #38bdf8);
  border-radius: 14px;
  padding: 13px;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
}

.folder-card:hover {
  transform: translateY(-2px);
  background: rgba(30, 41, 59, 0.95);
  border-color: rgba(56, 189, 248, 0.4);
}

.folder-card.virtual {
  border-top-color: #a78bfa;
  border-style: dashed;
  border-top-style: solid;
}

.folder-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.folder-icon {
  font-size: 1.5rem;
}

.folder-card-actions {
  display: flex;
  gap: 4px;
}

.folder-card-actions button {
  border: none;
  background: rgba(15, 23, 42, 0.65);
  border-radius: 6px;
  padding: 3px 6px;
  cursor: pointer;
  font-size: 0.78rem;
}

.sys-pill {
  font-size: 0.7rem;
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.15);
  color: #7dd3fc;
}

.virtual-pill {
  background: rgba(167, 139, 250, 0.15);
  color: #c4b5fd;
}

.folder-name {
  font-weight: 700;
  color: #f8fafc;
  font-size: 0.93rem;
}

.folder-meta {
  font-size: 0.78rem;
  color: #94a3b8;
  margin-top: 3px;
}

/* Items Grid */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.item-card {
  background: rgba(30, 41, 59, 0.62);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 14px;
  padding: 13px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.item-card:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(148, 163, 184, 0.35);
}

.item-card.selected,
.item-card.inspected {
  border-color: #38bdf8;
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.35);
}

.item-card-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-badge {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  color: #e2e8f0;
  font-weight: 600;
}

.type-project { background: rgba(56, 189, 248, 0.16); color: #7dd3fc; }
.type-content_plan { background: rgba(16, 185, 129, 0.16); color: #6ee7b7; }
.type-plan_post { background: rgba(167, 139, 250, 0.18); color: #c4b5fd; }
.type-quick_task { background: rgba(251, 191, 36, 0.18); color: #fde68a; }
.type-file { background: rgba(236, 72, 153, 0.16); color: #f9a8d4; }
.type-link { background: rgba(99, 102, 241, 0.18); color: #a5b4fc; }
.type-note { background: rgba(45, 212, 191, 0.16); color: #5eead4; }

.origin-badge {
  margin-right: auto;
  font-size: 0.7rem;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.14);
  color: #cbd5e1;
}

.origin-badge.auto {
  background: rgba(56, 189, 248, 0.14);
  color: #7dd3fc;
}

.item-title {
  margin: 0;
  font-size: 0.92rem;
  color: #f8fafc;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-subtitle {
  margin: 0;
  font-size: 0.78rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-card-foot {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date-label {
  font-size: 0.75rem;
  color: #64748b;
}

.quick-btns {
  display: flex;
  gap: 5px;
}

.quick-btns button {
  border: none;
  background: rgba(15, 23, 42, 0.65);
  border-radius: 7px;
  padding: 4px 7px;
  cursor: pointer;
  font-size: 0.82rem;
}

.quick-btns button:hover {
  background: rgba(56, 189, 248, 0.25);
}

/* List View */
.items-table-wrap {
  overflow-x: auto;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 12px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.items-table th,
.items-table td {
  padding: 10px 12px;
  text-align: right;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.items-table th {
  background: rgba(30, 41, 59, 0.8);
  color: #94a3b8;
  font-weight: 600;
}

.items-table tbody tr {
  cursor: pointer;
}

.items-table tbody tr:hover {
  background: rgba(30, 41, 59, 0.55);
}

.items-table tbody tr.selected,
.items-table tbody tr.inspected {
  background: rgba(56, 189, 248, 0.1);
}

.list-title-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.list-icon {
  font-size: 1.2rem;
}

.list-title {
  font-weight: 600;
  color: #f8fafc;
}

.list-sub {
  font-size: 0.76rem;
  color: #94a3b8;
}

.table-actions {
  display: flex;
  gap: 5px;
}

.tbl-btn {
  border: none;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
}

/* Inspector Drawer */
.inspector-drawer {
  width: 320px;
  flex-shrink: 0;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 18px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.inspector-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.inspector-title-group {
  display: flex;
  gap: 10px;
}

.inspector-icon {
  font-size: 1.5rem;
}

.inspector-title-group h3 {
  margin: 6px 0 0;
  font-size: 0.96rem;
  color: #f8fafc;
}

.close-inspector {
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1rem;
}

.inspector-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meta-block label,
.meta-cell label {
  display: block;
  font-size: 0.74rem;
  color: #64748b;
  margin-bottom: 3px;
}

.meta-block p {
  margin: 0;
  font-size: 0.84rem;
  color: #cbd5e1;
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  background: rgba(30, 41, 59, 0.48);
  padding: 10px;
  border-radius: 12px;
}

.meta-cell span {
  font-size: 0.8rem;
  color: #f1f5f9;
  font-weight: 600;
}

.note-box {
  background: rgba(30, 41, 59, 0.55);
  padding: 9px;
  border-radius: 10px;
  white-space: pre-wrap;
}

.file-chip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.65);
  padding: 8px 10px;
  border-radius: 9px;
  font-size: 0.8rem;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag-pill {
  font-size: 0.74rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

.inspector-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-action {
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  border: none;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  color: #fff;
}

.btn-action.primary { background: linear-gradient(135deg, #0284c7, #4f46e5); }
.btn-action.secondary { background: rgba(51, 65, 85, 0.9); color: #e2e8f0; }
.btn-action.restore { background: #059669; }
.btn-action.danger { background: rgba(239, 68, 68, 0.22); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.4); }

/* Empty & Loading */
.drive-empty,
.drive-loading {
  margin: auto;
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
}

.empty-emoji {
  font-size: 3rem;
  margin-bottom: 10px;
}

.loader-ring {
  width: 34px;
  height: 34px;
  border: 3px solid rgba(56, 189, 248, 0.2);
  border-top-color: #38bdf8;
  border-radius: 50%;
  margin: 0 auto 10px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Modals */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(5px);
  display: grid;
  place-items: center;
  padding: 16px;
}

.drive-modal {
  width: 100%;
  max-width: 480px;
  background: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-head h3 {
  margin: 0;
  font-size: 1.02rem;
  color: #f8fafc;
}

.modal-head button {
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.form-group label {
  font-size: 0.82rem;
  color: #cbd5e1;
}

.form-group input,
.form-group textarea {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 10px;
  padding: 9px 11px;
  color: #f8fafc;
  font-size: 0.88rem;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.emoji-choices,
.color-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.emoji-choices button {
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(30, 41, 59, 0.7);
  border-radius: 8px;
  padding: 5px 8px;
  cursor: pointer;
}

.emoji-choices button.active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.22);
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
}

.color-dot.active {
  border-color: #fff;
  transform: scale(1.1);
}

.type-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.type-tabs button {
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(30, 41, 59, 0.65);
  color: #cbd5e1;
  border-radius: 9px;
  padding: 7px 6px;
  font-size: 0.8rem;
  cursor: pointer;
}

.type-tabs button.active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.18);
  color: #e0f2fe;
}

.move-tree-box {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.modal-foot .btn-drive-new {
  width: auto;
}

@media (max-width: 1100px) {
  .archive-drive-shell {
    flex-direction: column;
  }
  .drive-rail,
  .inspector-drawer {
    width: 100%;
  }
}
</style>
