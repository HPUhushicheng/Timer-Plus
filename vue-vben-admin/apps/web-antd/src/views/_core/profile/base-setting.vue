<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { updateProfileApi } from '#/api';

const userStore = useUserStore();
const profileBaseSettingRef = ref();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'name',
      component: 'Input',
      label: '姓名',
      rules: 'required',
    },
    {
      fieldName: 'major',
      component: 'Input',
      label: '专业',
    },
    {
      fieldName: 'tel',
      component: 'Input',
      label: '电话',
    },
    {
      fieldName: 'qq',
      component: 'Input',
      label: 'QQ',
    },
  ];
});

// Populate form from user store
const userInfo = userStore.userInfo;
const formValues = {
  name: userInfo?.realName || '',
  major: userInfo?.desc || '',
  tel: (userInfo as any)?.tel || '',
  qq: (userInfo as any)?.qq || '',
};

// Expose setValues for parent
defineExpose({
  setValues: (vals: Record<string, any>) => {
    profileBaseSettingRef.value?.getFormApi()?.setValues(vals);
  },
});

async function handleSubmit(values: Record<string, any>) {
  try {
    const userId = Number(userStore.userInfo?.userId);
    if (!userId) {
      message.error('无法获取用户ID');
      return;
    }
    await updateProfileApi({
      id: userId,
      name: values.name,
      major: values.major,
      tel: values.tel,
      qq: values.qq,
    });
    // Update local store
    userStore.setUserInfo({
      ...userStore.userInfo,
      realName: values.name,
      desc: values.major,
      tel: values.tel,
      qq: values.qq,
    } as any);
    message.success('个人信息更新成功');
  } catch (e: any) {
    message.error(e?.message || '更新失败，请稍后重试');
  }
}
</script>
<template>
  <ProfileBaseSetting
    ref="profileBaseSettingRef"
    :form-schema="formSchema"
    :model="formValues"
    @submit="handleSubmit"
  />
</template>
