if exists('g:loaded_fall_highlights')
  finish
endif
let g:loaded_fall_highlights = 1

function! s:init() abort
  if has('nvim')
    highlight default link FallNormal FloatNormal
    highlight default link FallBorder FloatBorder
  else
    highlight default link FallNormal Normal
    highlight default link FallBorder EndOfBuffer
  endif

  " Query
  highlight default link FallQueryHeader FallBorder
  highlight default link FallQueryCounter FallBorder
  highlight default link FallQueryCursor Cursor

  " Selector
  highlight default link FallSelectorCursor CursorLine
  highlight default link FallSelectorSelected CurSearch
  sign define FallSelectorCursor linehl=FallSelectorCursor texthl=FallSelectorCursor
  sign define FallSelectorSelected text=≫

  " Picker
  highlight default link FallPickerMatch Search
endfunction

augroup fall_plugin_highlight
  autocmd!
  autocmd ColorScheme * call s:init()
augroup END

call s:init()
