-- Create default quests for companies that completed onboarding but have none
INSERT INTO quests (company_id, name, description, quest_type, conditions, xp_reward, is_active)
SELECT DISTINCT po.company_id, q.name, q.description, q.quest_type, q.conditions::jsonb, q.xp_reward, true
FROM performance_onboarding po
CROSS JOIN (
  VALUES 
    ('Hoàn thành hồ sơ', 'Cập nhật đầy đủ thông tin cá nhân', 'onboarding', '{"type": "profile_complete"}', 50),
    ('Nhiệm vụ đầu tiên', 'Hoàn thành nhiệm vụ đầu tiên của bạn', 'onboarding', '{"type": "first_quest"}', 100),
    ('Check-in hàng ngày', 'Đăng nhập và hoạt động mỗi ngày', 'daily', '{"type": "daily_checkin"}', 10),
    ('Học kỹ năng mới', 'Unlock một skill trong Skill Tree', 'special', '{"type": "first_skill"}', 75),
    ('Streak 3 ngày', 'Duy trì hoạt động 3 ngày liên tiếp', 'weekly', '{"type": "streak", "target": 3}', 50)
) AS q(name, description, quest_type, conditions, xp_reward)
WHERE po.is_completed = true
AND NOT EXISTS (
  SELECT 1 FROM quests qu WHERE qu.company_id = po.company_id
);