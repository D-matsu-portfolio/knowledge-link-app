import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Badge, Spinner, Alert, ListGroup, Row, Col, Card } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';

export default function SkillManager() {
  const { user } = useAuth();
  const [skillOptions, setSkillOptions] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 全スキルリストとユーザーの登録済みスキルを取得
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. 全スキルリストを取得
        const { data: allSkillsData, error: allSkillsError } = await supabase
          .from('skills')
          .select('id, name, category')
          .order('category, name'); // カテゴリと名前でソート
        if (allSkillsError) throw allSkillsError;

        // 2. データをカテゴリごとにグループ化
        const groupedOptions = allSkillsData.reduce((acc, skill) => {
          const category = skill.category || 'その他';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({ value: skill.name, label: skill.name });
          return acc;
        }, {});

        const formattedOptions = Object.keys(groupedOptions).map(category => ({
          label: category,
          options: groupedOptions[category]
        }));
        setSkillOptions(formattedOptions);

        // 3. ユーザーのスキルリストを取得
        const { data: userSkillsData, error: userSkillsError } = await supabase
          .from('profile_skills')
          .select('id, skill_id, type, skills(name)')
          .eq('profile_id', user.id);
        if (userSkillsError) throw userSkillsError;
        setUserSkills(userSkillsData);

      } catch (error) {
        setError('スキルの読み込みに失敗しました: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // スキルを追加する処理（RPC呼び出し）
  const handleAddSkill = async (skillName, type) => {
    if (!skillName || isSubmitting) return;
    
    const isAlreadyAdded = userSkills.some(s => s.skills.name.toLowerCase() === skillName.toLowerCase() && s.type === type);
    if (isAlreadyAdded) {
      setError(`${type === 'TEACHABLE' ? '教えられるスキル' : '学びたいスキル'}に既に追加されています。`);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const { data: skill_id, error: rpcError } = await supabase.rpc('find_or_create_skill', {
        skill_name: skillName
      });
      if (rpcError) throw rpcError;

      const { data: newUserSkill, error: insertError } = await supabase
        .from('profile_skills')
        .insert({ profile_id: user.id, skill_id: skill_id, type: type })
        .select('id, skill_id, type, skills(name)')
        .single();
      if (insertError) throw insertError;

      setUserSkills([...userSkills, newUserSkill]);
      
      // UIの選択肢に即時反映させるため、skillOptionsにも新しいスキルを追加
      const newOption = { value: skillName, label: skillName };
      const otherGroup = skillOptions.find(group => group.label === 'その他');
      if (otherGroup) {
        if (!otherGroup.options.some(opt => opt.value === skillName)) {
          otherGroup.options.push(newOption);
          setSkillOptions([...skillOptions]);
        }
      } else {
        setSkillOptions([...skillOptions, { label: 'その他', options: [newOption] }]);
      }

    } catch (error) {
      setError('スキルの追加に失敗しました: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // スキルを削除する処理
  const handleRemoveSkill = async (profileSkillId) => {
    try {
      const { error } = await supabase.from('profile_skills').delete().eq('id', profileSkillId);
      if (error) throw error;
      setUserSkills(userSkills.filter(s => s.id !== profileSkillId));
    } catch (error) {
      setError('スキルの削除に失敗しました: ' + error.message);
    }
  };

  const SkillSection = ({ title, type }) => {
    const currentSkills = userSkills.filter(s => s.type === type);

    const handleChange = (selectedOption) => {
      if (selectedOption) {
        handleAddSkill(selectedOption.value, type);
      }
    };
    
    const handleCreate = (inputValue) => {
      handleAddSkill(inputValue, type);
    };

    return (
      <Card>
        <Card.Header as="h5">{title}</Card.Header>
        <Card.Body>
          <CreatableSelect
            isClearable
            options={skillOptions}
            onChange={handleChange}
            onCreateOption={handleCreate}
            placeholder="スキルを検索または入力..."
            formatCreateLabel={inputValue => `「${inputValue}」を新しく追加`}
            isLoading={isSubmitting}
            isDisabled={isSubmitting}
          />
          <ListGroup variant="flush" className="mt-3">
            {currentSkills.length > 0 ? currentSkills.map(skill => (
              <ListGroup.Item key={skill.id} className="d-flex justify-content-between align-items-center">
                {skill.skills.name}
                <Badge pill bg="danger" onClick={() => handleRemoveSkill(skill.id)} style={{ cursor: 'pointer' }}>
                  ×
                </Badge>
              </ListGroup.Item>
            )) : <p className="text-muted mt-2">スキルが登録されていません。</p>}
          </ListGroup>
        </Card.Body>
      </Card>
    );
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <div>
      <h3 className="text-center mb-4">スキル管理</h3>
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      <Row>
        <Col md={6} className="mb-3 mb-md-0">
          <SkillSection title="教えられるスキル" type="TEACHABLE" />
        </Col>
        <Col md={6}>
          <SkillSection title="学びたいスキル" type="LEARNABLE" />
        </Col>
      </Row>
    </div>
  );
}
