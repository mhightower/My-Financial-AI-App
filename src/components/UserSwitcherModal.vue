<template>
  <div v-if="isOpen" ref="modalTrapRef" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="user-modal-title" @click.self="closeModal" @keydown.escape="closeModal">
    <div class="modal">
      <div class="modal-header">
        <h2 id="user-modal-title">User Management</h2>
        <button @click="closeModal" class="close-btn" aria-label="Close user management">✕</button>
      </div>

      <div class="modal-body">
        <!-- Existing Users -->
        <div v-if="users.length > 0" class="section">
          <div class="section-label">Switch User</div>
          <div class="users-list">
            <div
              v-for="user in users"
              :key="user.id"
              class="user-row"
              :class="{ active: currentUser?.id === user.id }"
            >
              <div
                class="user-avatar"
                :style="{ backgroundColor: user.avatar_color || '#D99D38' }"
                aria-hidden="true"
              >
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <span class="user-row-name">{{ user.name }}</span>
              <div class="user-row-actions">
                <span v-if="currentUser?.id === user.id" class="active-badge">Active</span>
                <button
                  v-else
                  @click="switchUser(user)"
                  class="btn btn-ghost btn-sm"
                >
                  Switch
                </button>
                <button
                  @click="deleteUserConfirm(user.id)"
                  class="btn btn-danger btn-sm"
                  :aria-label="`Delete user ${user.name}`"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Create New User -->
        <div class="section">
          <div class="section-label">Create New User</div>
          <form @submit.prevent="createNewUser" class="create-form">
            <div class="form-group">
              <label for="userName">Name *</label>
              <input
                id="userName"
                v-model="newUserName"
                type="text"
                placeholder="Your name"
                required
              />
            </div>

            <div class="form-group">
              <label>Avatar Color</label>
              <div class="color-palette">
                <button
                  v-for="color in AVATAR_COLORS"
                  :key="color"
                  type="button"
                  class="color-swatch"
                  :style="{ backgroundColor: color }"
                  :class="{ selected: newUserColor === color }"
                  :aria-label="`Select ${COLOR_NAMES[color]} avatar color`"
                  :aria-pressed="newUserColor === color"
                  @click="newUserColor = color"
                ></button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width:100%;" :disabled="loading">
              {{ loading ? 'Creating…' : 'Create User' }}
            </button>
          </form>
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useFocusTrap } from '../composables/useFocusTrap'

const AVATAR_COLORS = [
  '#D99D38',
  '#1DB87A',
  '#4299e1',
  '#9f7aea',
  '#E04545',
  '#ed8936',
]

const COLOR_NAMES = {
  '#D99D38': 'Amber',
  '#1DB87A': 'Green',
  '#4299e1': 'Blue',
  '#9f7aea': 'Purple',
  '#E04545': 'Red',
  '#ed8936': 'Orange',
}

const userStore = useUserStore()

const isOpen = ref(false)
const loading = ref(false)
const error = ref(null)
const currentUser = computed(() => userStore.currentUser)
const users = ref([])
const newUserName = ref('')
const newUserColor = ref(AVATAR_COLORS[0])

const { trapRef: modalTrapRef } = useFocusTrap(isOpen)

const openModal = () => {
  isOpen.value = true
  loadUsers()
}

const closeModal = () => {
  isOpen.value = false
  error.value = null
  newUserName.value = ''
  newUserColor.value = AVATAR_COLORS[0]
}

const loadUsers = async () => {
  loading.value = true
  error.value = null
  await userStore.fetchUsers()
  users.value = userStore.users
  loading.value = false
}

const switchUser = (user) => {
  userStore.setCurrentUser(user)
}

const createNewUser = async () => {
  if (!newUserName.value.trim()) {
    error.value = 'Name is required'
    return
  }

  loading.value = true
  error.value = null

  const newUser = await userStore.createUser({
    name: newUserName.value.trim(),
    avatar_color: newUserColor.value
  })

  if (newUser) {
    users.value.push(newUser)
    switchUser(newUser)
    newUserName.value = ''
    newUserColor.value = AVATAR_COLORS[0]
  } else {
    error.value = userStore.error || 'Failed to create user'
  }

  loading.value = false
}

const deleteUserConfirm = (userId) => {
  if (confirm('Delete this user and all their data?')) {
    deleteUser(userId)
  }
}

const deleteUser = async (userId) => {
  loading.value = true
  error.value = null

  try {
    await userStore.deleteUser(userId)
    users.value = users.value.filter(u => u.id !== userId)
    if (currentUser.value?.id === userId) {
      userStore.logout()
    }
  } catch (err) {
    error.value = 'Failed to delete user'
  }

  loading.value = false
}

defineExpose({ openModal, closeModal, isOpen })

onMounted(() => {
  loadUsers()
  if (!currentUser.value) {
    isOpen.value = true
  }
})
</script>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.section-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-1);
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-2);
  transition: border-color 0.12s;
}

.user-row.active {
  border-color: var(--amber);
  background: var(--amber-glow);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--bg-0);
  flex-shrink: 0;
}

.user-row-name {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-0);
}

.user-row-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.active-badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--amber);
  padding: 0.2rem 0.5rem;
  border-radius: 2rem;
  background: var(--amber-dim);
}

.divider {
  height: 1px;
  background: var(--border);
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Color palette */
.color-palette {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.12s;
  outline: none;
}

.color-swatch:hover {
  transform: scale(1.15);
  border-color: var(--text-0);
}

.color-swatch.selected {
  border-color: var(--text-0);
  box-shadow: 0 0 0 3px var(--bg-2), 0 0 0 5px var(--text-0);
}
</style>
