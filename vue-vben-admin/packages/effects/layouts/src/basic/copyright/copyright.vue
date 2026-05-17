<script lang="ts" setup>
interface Props {
  companyName?: string;
  companySiteLink?: string;
  date?: string;
  icp?: string;
  icpLink?: string;
}

defineOptions({
  name: 'Copyright',
});

withDefaults(defineProps<Props>(), {
  companyName: 'respect-H',
  companySiteLink: '',
  date: '2026',
  icp: '',
  icpLink: '',
});
</script>

<template>
  <div class="text-md flex-center">
    <!-- ICP Link -->
    <a
      v-if="icp"
      :href="icpLink || 'javascript:void(0)'"
      class="mx-1 hover:text-primary-hover"
      target="_blank"
    >
      {{ icp }}
    </a>

    <!-- Copyright Text -->
    Copyright © {{ date }}

    <!-- Company -->
    <template v-if="companyName">
      <a
        v-if="companySiteLink"
        :href="companySiteLink"
        class="mx-1 hover:text-primary-hover"
        target="_blank"
      >
        {{ companyName }}
      </a>
      <span v-else class="mx-1">
        {{ companyName }}
      </span>
    </template>
  </div>
</template>
