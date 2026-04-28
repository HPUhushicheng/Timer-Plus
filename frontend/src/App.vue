<template>
    <router-view/>
  </template>
  
  <script>
  export default {
  name: 'App',
  setup() {
    const el = document.getElementById('loadingPage')
    if (el) el.remove()
  }
  }
  </script>
  <style lang="less"></style>