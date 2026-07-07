---
title: TouchDesigner RenderStream
anchor: touchdesigner-renderstream
order: 5
tools: [TouchDesigner, Disguise, C++, Python]
video:
  src: /media/touchrender.mp4
  caption: >-
    A keyframed camera in Disguise (left) sends its stateful data to
    TouchDesigner (right). A 3D scene designed in TouchDesigner uses this as
    the data source for its own internal camera, and the resulting frames are
    sent back to Disguise and displayed on a theoretical LED volume stage.
---
A series of TouchDesigner
[custom operators](https://docs.derivative.ca/Custom_Operators) that implement
the Disguise [RenderStream API](https://github.com/disguise-one/RenderStream).
Allows any TouchDesigner texture to be sent to Disguise à la Unreal or Notch
RenderStream.
