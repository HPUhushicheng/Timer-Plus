<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  const el = document.getElementById('loadingPage')
  if (el) el.remove()
})
</script>

<template>
  <router-view />
</template>

<style lang="less"></style>
