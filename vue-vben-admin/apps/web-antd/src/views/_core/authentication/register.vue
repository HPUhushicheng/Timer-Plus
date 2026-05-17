<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, h, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationRegister, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Register' });

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入学号',
      },
      fieldName: 'studentid',
      label: '学号',
      rules: z.string().min(1, { message: '请输入学号' }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入姓名',
      },
      fieldName: 'name',
      label: '姓名',
      rules: z.string().min(1, { message: '请输入姓名' }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入专业',
      },
      fieldName: 'major',
      label: '专业',
      rules: z.string().min(1, { message: '请输入专业' }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入手机号',
      },
      fieldName: 'tel',
      label: '手机号',
      rules: z.string().min(1, { message: '请输入手机号' }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入密码（至少6位）',
      },
      fieldName: 'password',
      label: '密码',
      renderComponentContent() {
        return {
          strengthText: () => '密码强度',
        };
      },
      rules: z.string().min(6, { message: '密码长度不能少于6位' }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: '请确认密码',
      },
      dependencies: {
        rules(values) {
          const { password } = values;
          return z
            .string({ required_error: '请确认密码' })
            .min(1, { message: '请确认密码' })
            .refine((value) => value === password, {
              message: '两次输入的密码不一致',
            });
        },
        triggerFields: ['password'],
      },
      fieldName: 'confirmPassword',
      label: '确认密码',
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入QQ号（选填）',
      },
      fieldName: 'qq',
      label: 'QQ',
      rules: z.string().optional(),
    },
    {
      component: 'VbenCheckbox',
      fieldName: 'agreePolicy',
      renderComponentContent: () => ({
        default: () =>
          h('span', [
            '我已阅读并同意 ',
            h(
              'a',
              {
                class: 'vben-link ml-1 ',
                href: '',
              },
              '服务协议 & 隐私政策',
            ),
          ]),
      }),
      rules: z.boolean().refine((value) => !!value, {
        message: '请阅读并同意服务协议',
      }),
    },
  ];
});

async function handleSubmit(values: Recordable<any>) {
  loading.value = true;
  try {
    await authStore.authRegister(values);
    // 注册成功后跳转到登录页
    await router.push('/auth/login');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthenticationRegister
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleSubmit"
  />
</template>
