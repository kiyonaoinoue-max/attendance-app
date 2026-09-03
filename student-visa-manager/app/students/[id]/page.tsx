'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { v4 as uuidv4 } from 'uuid';
import { 
  Student, 
  RenewalRecord,
  RESIDENCE_STATUS_OPTIONS, 
  EDUCATION_LEVEL_OPTIONS, 
  INDUSTRY_OPTIONS 
} from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Trash2, Save, Plus, History, Calendar, RefreshCw } from 'lucide-react';

export default function StudentEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';

  const students = useStore((state: any) => state.students) || [];
  const addStudent = useStore((state: any) => state.addStudent);
  const updateStudent = useStore((state: any) => state.updateStudent);
  const deleteStudent = useStore((state: any) => state.deleteStudent);

  const [formData, setFormData] = useState<Partial<Student>>({
    id: uuidv4(),
    partTimeJobs: [],
    renewalHistory: [],
    workPermitStatus: 'no',
  });

  // クイック在留期限更新用ステート
  const [showQuickRenew, setShowQuickRenew] = useState(false);
  const [newExpiryInput, setNewExpiryInput] = useState('');
  const [renewDateInput, setRenewDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [renewNoteInput, setRenewNoteInput] = useState('');

  const handleApplyQuickRenew = () => {
    if (!newExpiryInput) return;
    const record: RenewalRecord = {
      id: uuidv4(),
      date: renewDateInput || new Date().toISOString().split('T')[0],
      previousExpiry: formData.residenceExpiry || '未設定',
      newExpiry: newExpiryInput,
      note: renewNoteInput || '在留期間更新',
    };
    setFormData(prev => ({
      ...prev,
      residenceExpiry: newExpiryInput,
      renewalHistory: [record, ...(prev.renewalHistory || [])],
    }));
    setShowQuickRenew(false);
    setNewExpiryInput('');
    setRenewNoteInput('');
  };

  const handleAddManualRenewal = () => {
    const record: RenewalRecord = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      previousExpiry: '',
      newExpiry: '',
      note: '',
    };
    setFormData(prev => ({
      ...prev,
      renewalHistory: [...(prev.renewalHistory || []), record],
    }));
  };

  const handleRenewalChange = (index: number, field: keyof RenewalRecord, value: string) => {
    const updated = [...(formData.renewalHistory || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, renewalHistory: updated }));
  };

  const handleRemoveRenewal = (index: number) => {
    const updated = [...(formData.renewalHistory || [])];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, renewalHistory: updated }));
  };

  useEffect(() => {
    if (!isNew) {
      const existingStudent = students.find((s: Student) => s.id === id);
      if (existingStudent) {
        setFormData(existingStudent);
      }
    }
  }, [id, isNew, students]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDatePaste = (field: string, text: string) => {
    if (!text) return;
    const cleaned = text.trim().replace(/[／.]/g, '-');
    if (/^\d{8}$/.test(cleaned)) {
      const y = cleaned.substring(0, 4);
      const m = cleaned.substring(4, 6);
      const d = cleaned.substring(6, 8);
      handleChange(field, `${y}-${m}-${d}`);
      return;
    }
    const parts = cleaned.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      handleChange(field, `${y}-${m}-${d}`);
      return;
    }
    handleChange(field, text.trim());
  };

  const handleJobChange = (index: number, field: string, value: any) => {
    const updatedJobs = [...(formData.partTimeJobs || [])];
    updatedJobs[index] = { ...updatedJobs[index], [field]: value };
    handleChange('partTimeJobs', updatedJobs);
  };

  const addJob = () => {
    const newJob = {
      id: uuidv4(),
      companyName: '',
      address: '',
      industry: '',
      weeklyHours: 0,
      startDate: '',
      isActive: true,
    };
    handleChange('partTimeJobs', [...(formData.partTimeJobs || []), newJob]);
  };

  const removeJob = (index: number) => {
    const updatedJobs = [...(formData.partTimeJobs || [])];
    updatedJobs.splice(index, 1);
    handleChange('partTimeJobs', updatedJobs);
  };

  const totalWeeklyHours = (formData.partTimeJobs || [])
    .filter((j: any) => j.isActive)
    .reduce((sum: number, job: any) => sum + (Number(job.weeklyHours) || 0), 0);

  const handleSave = () => {
    if (isNew) {
      if (addStudent) addStudent(formData as Student);
    } else {
      if (updateStudent) updateStudent(id, formData as Student);
    }
    router.push('/students');
  };

  const handleDelete = () => {
    if (window.confirm('この学生を削除してもよろしいですか？')) {
      if (deleteStudent) deleteStudent(id);
      router.push('/students');
    }
  };

  // Safe fallbacks for options
  const residenceOptions = RESIDENCE_STATUS_OPTIONS || ['留学', '家族滞在', '特定活動'];
  const educationOptions = EDUCATION_LEVEL_OPTIONS || ['高校卒業', '大学卒業', '専門学校卒業'];
  const industryOptions = INDUSTRY_OPTIONS || ['飲食', '小売', '清掃', '工場', 'その他'];

  return (
    <div className="container mx-auto p-4 pb-24 max-w-2xl bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="px-2">
          <ArrowLeft className="h-5 w-5 mr-2" />
          戻る
        </Button>
        <h1 className="text-xl font-bold">{isNew ? '新規留学生登録' : '留学生情報編集'}</h1>
        <div className="w-16"></div> {/* Spacer for centering */}
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="visa">在留カード</TabsTrigger>
          <TabsTrigger value="history">学歴</TabsTrigger>
          <TabsTrigger value="work">アルバイト</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>氏名（漢字）</Label>
                <Input value={formData.name || ''} onChange={e => handleChange('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>氏名（カタカナ）</Label>
                <Input value={formData.nameKana || ''} onChange={e => handleChange('nameKana', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>氏名（ローマ字）</Label>
                <Input value={formData.nameRomaji || ''} onChange={e => handleChange('nameRomaji', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>学籍番号</Label>
                  <Input value={formData.studentNumber || ''} onChange={e => handleChange('studentNumber', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>学年</Label>
                  <Select value={String(formData.grade || '')} onValueChange={v => handleChange('grade', Number(v))}>
                    <SelectTrigger><SelectValue placeholder="選択..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1年</SelectItem>
                      <SelectItem value="2">2年</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>クラス</Label>
                <Input value={formData.className || ''} onChange={e => handleChange('className', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visa" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>在留カード番号</Label>
                <Input 
                  placeholder="例: AB12345678CD" 
                  value={formData.residenceCardNumber || ''} 
                  onChange={e => handleChange('residenceCardNumber', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>在留資格</Label>
                <Select value={formData.residenceStatus || ''} onValueChange={v => handleChange('residenceStatus', v)}>
                  <SelectTrigger><SelectValue placeholder="選択..." /></SelectTrigger>
                  <SelectContent>
                    {residenceOptions.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>現在の在留期限</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => setShowQuickRenew(!showQuickRenew)}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    在留期限を更新・履歴記録
                  </Button>
                </div>
                <Input 
                  type="date" 
                  value={formData.residenceExpiry || ''} 
                  onChange={e => handleChange('residenceExpiry', e.target.value)} 
                  onPaste={e => {
                    const text = e.clipboardData.getData('text');
                    if (text) {
                      e.preventDefault();
                      handleDatePaste('residenceExpiry', text);
                    }
                  }}
                />
              </div>

              {/* クイック更新フォーム */}
              {showQuickRenew && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3 mt-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-900 flex items-center">
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      在留期間の更新記録
                    </h4>
                    <span className="text-[10px] text-blue-600">旧期限: {formData.residenceExpiry || '未設定'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">新しい在留期限 <span className="text-red-500">*</span></Label>
                      <Input 
                        type="date" 
                        className="bg-white text-xs h-8" 
                        value={newExpiryInput} 
                        onChange={e => setNewExpiryInput(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">更新手続き完了日</Label>
                      <Input 
                        type="date" 
                        className="bg-white text-xs h-8" 
                        value={renewDateInput} 
                        onChange={e => setRenewDateInput(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">メモ・備考</Label>
                    <Input 
                      placeholder="例: 入国管理局にて1年更新許可" 
                      className="bg-white text-xs h-8" 
                      value={renewNoteInput} 
                      onChange={e => setRenewNoteInput(e.target.value)} 
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-7"
                      onClick={() => setShowQuickRenew(false)}
                    >
                      キャンセル
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleApplyQuickRenew}
                    >
                      更新を適用して履歴保存
                    </Button>
                  </div>
                </div>
              )}

              {/* 在留資格更新履歴 セクション */}
              <div className="mt-8 pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-blue-600" />
                    <Label className="text-base font-bold">在留資格の更新履歴</Label>
                    <span className="text-xs text-slate-500 font-normal">
                      ({(formData.renewalHistory || []).length}件)
                    </span>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={handleAddManualRenewal}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    履歴を手動追加
                  </Button>
                </div>

                {(formData.renewalHistory || []).length === 0 ? (
                  <div className="p-6 text-center border border-dashed rounded-lg text-slate-400 text-xs">
                    更新履歴はまだ登録されていません。「在留期限を更新」または「手動追加」から入力できます。
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(formData.renewalHistory || []).map((rec: RenewalRecord, idx: number) => (
                      <div key={rec.id || idx} className="p-3 border rounded-lg bg-white relative space-y-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-1.5 right-1.5 h-6 w-6 text-slate-400 hover:text-red-500" 
                          onClick={() => handleRemoveRenewal(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500">更新年月日</Label>
                            <Input 
                              type="date" 
                              className="text-xs h-7" 
                              value={rec.date || ''} 
                              onChange={e => handleRenewalChange(idx, 'date', e.target.value)} 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500">旧期限</Label>
                            <Input 
                              type="date" 
                              className="text-xs h-7 text-slate-500" 
                              value={rec.previousExpiry || ''} 
                              onChange={e => handleRenewalChange(idx, 'previousExpiry', e.target.value)} 
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-blue-600 font-bold">新期限</Label>
                            <Input 
                              type="date" 
                              className="text-xs h-7 font-bold border-blue-300" 
                              value={rec.newExpiry || ''} 
                              onChange={e => handleRenewalChange(idx, 'newExpiry', e.target.value)} 
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-500">メモ・申請内容</Label>
                          <Input 
                            placeholder="更新理由や備忘録..." 
                            className="text-xs h-7" 
                            value={rec.note || ''} 
                            onChange={e => handleRenewalChange(idx, 'note', e.target.value)} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>出身国</Label>
                <Input value={formData.nationality || ''} onChange={e => handleChange('nationality', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>最終学歴</Label>
                <Select value={formData.homeCountryEducation || ''} onValueChange={v => handleChange('homeCountryEducation', v)}>
                  <SelectTrigger><SelectValue placeholder="選択..." /></SelectTrigger>
                  <SelectContent>
                    {educationOptions.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>日本語学校名</Label>
                <Input value={formData.japaneseSchoolName || ''} onChange={e => handleChange('japaneseSchoolName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>入学日</Label>
                <Input type="date" value={formData.enrollmentDate || ''} onChange={e => handleChange('enrollmentDate', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>資格外活動許可</Label>
                <Select value={formData.workPermitStatus || 'no'} onValueChange={v => handleChange('workPermitStatus', v)}>
                  <SelectTrigger><SelectValue placeholder="選択..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">あり</SelectItem>
                    <SelectItem value="no">なし</SelectItem>
                    <SelectItem value="pending">申請中</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.workPermitStatus === 'yes' && (
                <div className="space-y-2">
                  <Label>許可期限</Label>
                  <Input type="date" value={formData.workPermitExpiry || ''} onChange={e => handleChange('workPermitExpiry', e.target.value)} />
                </div>
              )}

              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-lg font-bold">アルバイト先</Label>
                  <div className={`text-sm font-bold ${totalWeeklyHours > 28 ? 'text-red-500' : 'text-green-600'}`}>
                    合計週: {totalWeeklyHours}時間 {totalWeeklyHours > 28 && '(28時間超過)'}
                  </div>
                </div>

                <div className="space-y-6">
                  {formData.partTimeJobs?.map((job: any, index: number) => (
                    <div key={job.id} className="p-4 border rounded-lg bg-white relative space-y-3">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 text-red-500" 
                        onClick={() => removeJob(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="space-y-2 pt-2">
                        <Label>会社名</Label>
                        <Input value={job.companyName} onChange={e => handleJobChange(index, 'companyName', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>住所</Label>
                        <Input value={job.address} onChange={e => handleJobChange(index, 'address', e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>業種</Label>
                          <Select value={job.industry} onValueChange={v => handleJobChange(index, 'industry', v)}>
                            <SelectTrigger><SelectValue placeholder="選択..." /></SelectTrigger>
                            <SelectContent>
                              {industryOptions.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>週の労働時間</Label>
                          <Input type="number" value={job.weeklyHours || ''} onChange={e => handleJobChange(index, 'weeklyHours', Number(e.target.value))} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>勤務開始日</Label>
                        <Input type="date" value={job.startDate} onChange={e => handleJobChange(index, 'startDate', e.target.value)} />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Label>勤務中</Label>
                        <Switch checked={job.isActive} onCheckedChange={(v: boolean) => handleJobChange(index, 'isActive', v)} />
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-4" onClick={addJob}>
                  <Plus className="h-4 w-4 mr-2" />
                  アルバイトを追加
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-4 justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
        <div className="container max-w-2xl flex gap-4 mx-auto">
          {!isNew && (
            <Button variant="destructive" onClick={handleDelete} className="flex-1">
              <Trash2 className="h-4 w-4 mr-2" />
              削除
            </Button>
          )}
          <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
