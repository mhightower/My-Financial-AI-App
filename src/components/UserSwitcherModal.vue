<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>User Management</h2>
        <button @click="closeModal" class="close-btn">✕</button>
      </div>

      <div class="modal-body">
        <!-- Existing Users List -->
        <div class="section" v-if="users.length > 0">
          <h3>Switch User</h3>
          <div class="users-list">
            <div
              v-for="user in users"
              :key="user.id"
              class="user-card"
              :class="{ active: currentUser?.id === user.id }"
            >
              <div class="user-avatar" :style="{ backgroundColor: user.avatar_color || '#667eea' }"></div>
              <div class="user-info">
                <p class="user-name">{{ user.name }}</p>
              </div>
              <div class="user-actions">
                <button
                  v-if="currentUser?.id !== user.id"
                  @click="switchUser(user)"
                  class="btn-switch"
                >
                  Switch
                </button>
                <button
                  @click="deleteUserConfirm(user.id)"
                  class="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Create New User Form -->
        <div class="section create-user">
          <h3>Create New User</h3>
          <form @submit.prevent="createNewUser">
            <div class="form-group">
              <label for="userName">User Name</label>
              <input
                id="userName"
                v-model="newUserName"
                type="text"
                placeholder="Enter your name"
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
                  class="color-btn"
                  :style="{ backgroundColor: color }"
                  :class="{ selected: newUserColor === color }"
                  @click="newUserColor = color"
                  :title="color"
                ></button>
              </div>
            </div>

            <button type="submit" class="btn-create" :disabled="loading">
              {{ loading ? 'Creating...' : 'Create User' }}
            </button>
          </form>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/user'

const AVATAR_COLORS = [
  '#667eea',  // Purple
  '#48bb78',  // Green
  '#ed8936',  // Orange
  '#f56565',  // Red
  '#4299e1',  // Blue
  '#9f7aea',  // Pink
]

const userStore = useUserStore()

const isOpen = ref(false)
const loading = ref(false)
const error = ref(null)
const currentUser = computed(() => userStore.currentUser)
const users = ref([])
const newUserName = ref('')
const newUserColor = ref(AVATAR_COLORS[0])

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
  currentUser.value = userStore.currentUser
  loading.value = false
}

const switchUser = (user) => {
  userStore.setCurrentUser(user)
  currentUser.value = user
}

const createNewUser = async () => {
  if (!newUserName.value.trim()) {
    error.value = 'User name is required'
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
  if (confirm('Are you sure you want to delete this user and all their data?')) {
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
      currentUser.value = null
      userStore.logout()
    }
  } catch (err) {
    error.value = 'Failed to delete user'
  }

  loading.value = false
}

defineExpose({
  openModal,
  closeModal,
  isOpen
})

onMounted(() => {
  loadUsers()
  // Auto-open modal if no current user on first load
  if (!currentUser.value) {
    isOpen.value = true
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.section {
  margin-bottom: 2rem;
}

.section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
  font-weight: 600;
}

.users-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #eee;
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.user-card:hover {
  border-color: #667eea;
}

.user-card.active {
  border-color: #667eea;
  background: #f5f5ff;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-name {
  margin: 0;
  font-weight: 500;
  color: #333;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-switch,
.btn-delete {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-switch {
  background: #667eea;
  color: white;
}

.btn-switch:hover {
  background: #5568d3;
}

.btn-delete {
  background: #f0f0f0;
  color: #333;
}

.btn-delete:hover {
  background: #e0e0e0;
}

.create-user {
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.color-palette {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.2s;
}

.color-btn:hover {
  border-color: #333;
}

.color-btn.selected {
  border-color: #333;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #333;
}

.btn-create {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-create:hover:not(:disabled) {
  background: #5568d3;
}

.btn-create:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>
