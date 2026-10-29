# 本地数词音频

内容：`n14.wav` 十四、`n17.wav` 十七、`n40.wav` 四十、`n100.wav` 一百。

2026-10-25 以 macOS 内置 `/usr/bin/say -v Tingting -r 130` 合成，再用 `/usr/bin/afconvert -f WAVE -d LEI16@22050` 转换为单声道 PCM WAV。实际非空中间文件为 `n*-real.aiff`；首轮沙箱中合成的空文件保留为失败证据。调用系统语音服务后重新生成，并检查帧数、时长和非静音能量。中间 AIFF 保存在 `verification/phase5/B06/audio-source/`。没有用户录音、儿童声音、音色克隆或网络语音 API。用于本机离线学习。

播放完成与重播会保留；系统不采集麦克风，也不自动评价孩子的发音。
