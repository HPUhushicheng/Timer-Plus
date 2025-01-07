// src/stores/useUserStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', {
  state: () => ({
    studentId: '',
  }),
  actions: {
    setStudentId(id) {
      this.studentId = id;
    },
  },
});