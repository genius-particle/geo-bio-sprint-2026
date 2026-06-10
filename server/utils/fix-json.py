#!/usr/bin/env python3
"""修复 meta.json 中未转义的引号字符。

用法: python3 server/utils/fix-json.py {question_id}
示例: python3 server/utils/fix-json.py 2026-06-10-12-04-57

原理：逐字符跟踪 JSON 字符串边界，移除字符串值内部的非法引号字符。
"""
import json
import sys
import os

BAD_QUOTES = ['“', '”', '‘', '’']  # "" ''


def fix_raw_json(raw: str) -> str:
    """修复 JSON 文本中字符串值内部的未转义引号。"""
    result = []
    in_string = False
    i = 0
    while i < len(raw):
        ch = raw[i]
        if not in_string:
            if ch == '"':
                in_string = True
                result.append(ch)
            else:
                result.append(ch)
        else:
            # 转义字符，保留
            if ch == '\\' and i + 1 < len(raw):
                result.append(ch)
                result.append(raw[i + 1])
                i += 2
                continue
            elif ch == '"':
                # 判断是否为字符串结束：后面跟 , ] } : \n 或空白+这些
                j = i + 1
                while j < len(raw) and raw[j] in ' \t':
                    j += 1
                if j < len(raw) and raw[j] in ',]}\n:':
                    # 合法的字符串结束引号
                    in_string = False
                    result.append(ch)
                else:
                    # 字符串内部的非法引号，跳过
                    pass
            elif ch in BAD_QUOTES:
                # 中文引号也移除
                pass
            else:
                result.append(ch)
        i += 1
    return ''.join(result)


def main():
    if len(sys.argv) < 2:
        print("用法: python3 fix-json.py {question_id}")
        sys.exit(1)

    qid = sys.argv[1]
    path = f"data/questions/{qid}/meta.json"

    if not os.path.exists(path):
        print(f"文件不存在: {path}")
        sys.exit(1)

    raw = open(path, 'r', encoding='utf-8').read()

    # 先试原样解析
    try:
        json.loads(raw)
        print(f"OK: {qid} 已是有效 JSON，无需修复")
        return
    except json.JSONDecodeError as e:
        print(f"BROKEN: {qid} - {e}")

    # 修复
    fixed = fix_raw_json(raw)

    try:
        d = json.loads(fixed)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
            f.write('\n')
        print(f"FIXED: {qid}")
    except json.JSONDecodeError as e:
        print(f"STILL BROKEN: {qid} - {e}")
        # 保存修复后的文本供手动检查
        debug_path = f"data/questions/{qid}/meta.json.debug"
        with open(debug_path, 'w', encoding='utf-8') as f:
            f.write(fixed)
        print(f"已保存修复文本到 {debug_path} 供手动检查")
        sys.exit(1)


if __name__ == '__main__':
    main()
